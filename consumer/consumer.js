const assert = require('assert')
const delay = require('util').promisify(setTimeout)
const { createConsumerHandlerRegistry } = require('./consumer-handler-registry')
const { createPositionStore } = require('./position-store')
const { createRunner } = require('../runner')
const { operationError } = require('../errors')
const { throttleErrorLogging } = require('../logging')

/* istanbul ignore next */
const crashStopErrorStrategy = (error) => {
  throw error
}

exports.createConsumer = (options) => {
  assertOptions(options)

  const {
    log,
    name,
    positionUpdateInterval = 100,
    registerHandlers,
    messageStore,
    category,
    correlation,
    groupMember,
    groupSize,
    strict = false,
    errorStrategy = crashStopErrorStrategy,

    // TUNING
    highWaterMark = 500,
    lowWaterMark = 50,
    pollingIntervalMs = 100
  } = options

  const consumerError = operationError(`${name} consumer`)
  const prefix = (text) => `${name} consumer: ${text}`

  const positionStore = createPositionStore({ messageStore, streamName: category })
  let positionUpdateCount = 0

  const registry = createConsumerHandlerRegistry({ name, log, strict })
  registerHandlers(registry.register)

  const dispatch = async (messageData) => {
    await registry.handle(messageData)

    await updatePosition(messageData.globalPosition)
  }

  const updatePosition = async (globalPosition) => {
    positionUpdateCount++
    if (positionUpdateCount >= positionUpdateInterval) {
      try {
        await positionStore.put(globalPosition)
      } catch (inner) {
        const message = 'error updating consumer position'
        log.error({ err: inner, category, globalPosition }, prefix(message))
        throw consumerError(message, inner)
      }

      positionUpdateCount = 0
    }
  }

  const start = () => {
    let state = 'filling' // filling | draining | waitForMessages
    let nextVersion = 0
    let queue = []

    // --- BATCH FETCHING ----
    const getCategory = throttleErrorLogging(
      log,
      { category, correlation },
      prefix('error reading from stream'),
      prefix('reading from stream succeeded after encountering errors'),
      async (...args) => {
        return messageStore.getCategory(...args)
      }
    )

    const getBatch = async (version) => {
      let batch
      try {
        batch = await getCategory(category, {
          consumerGroupMember: groupMember,
          consumerGroupSize: groupSize,
          correlation,
          position: version
        })
      } catch (err) {
        // wait for next batch (i.e. retry)
        batch = []
      }

      if (batch.length) {
        runner.trigger('batch', batch)
      } else {
        runner.trigger('waitToGetBatch', version)
      }
    }

    const waitToGetBatch = async (version) => {
      await delay(pollingIntervalMs)
      runner.trigger('getBatch', version)
    }

    // --- CONSUMPTION ----

    const processMessage = async () => {
      const messageData = queue.shift()
      try {
        await dispatch(messageData)
      } catch (error) {
        try {
          await errorStrategy(error, messageData, dispatch)
        } catch (err) /* istanbul ignore next */ {
          // it is possible global uncaught exception handling will prevent/delay
          // process crash, so "pause" further message consumption and reading
          log.warn({ category, correlation, err }, prefix('processing paused due to error'))
          runner.pause()
          queue.unshift(messageData) // place back in queue for retry if unpaused

          // As of Node.js 12, uncaught promise rejections _still_ don't terminate
          // the process. As such, let's ensure users are accustomed to process
          // termination on fatal errors by throwing an uncaught exception. Use
          // of next tick is preferred over setImmediate to ensure other queued async
          // activity is not processed.
          process.nextTick(() => {
            throw err
          })

          return
        }
      }

      if (state === 'draining' && queue.length < lowWaterMark) {
        fill()
      }

      if (queue.length) {
        runner.trigger('processMessage')
      } else {
        state = 'waitForMessages'
      }
    }

    const batch = (batch) => {
      queue = queue.concat(batch)

      nextVersion = queue[queue.length - 1].globalPosition + 1

      const waiting = state === 'waitForMessages'

      if (queue.length < highWaterMark) {
        fill()
      } else {
        state = 'draining'
      }

      if (waiting) {
        runner.trigger('processMessage')
      }
    }

    const fill = () => {
      state = 'filling'
      runner.trigger('getBatch', nextVersion)
    }

    const positionStoreGet = throttleErrorLogging(
      log,
      { name, category },
      prefix('error reading consumer start position'),
      prefix('reading consumer start position succeeded after encountering errors'),
      () => positionStore.get()
    )

    const getPosition = async () => {
      try {
        const position = await positionStoreGet()
        nextVersion = typeof position === 'number' ? position + 1 : 0
        runner.trigger('getBatch', nextVersion)
      } catch (err) {
        await delay(pollingIntervalMs)
        runner.trigger('getPosition')
      }
    }

    const tasks = { batch, fill, getBatch, getPosition, waitToGetBatch, processMessage }
    const runner = createRunner({ tasks })

    state = 'waitForMessages'
    runner.trigger('getPosition')

    return runner
  }

  return { dispatch, positionStore, start }
}

const errorMessage = (msg) => `consumer: ${msg}`

const assertOptions = (options) => {
  assert(options, errorMessage('options required'))
  assert(options.log, errorMessage('log required'))
  assert(typeof options.name === 'string', errorMessage('name required'))
  assert(typeof options.registerHandlers === 'function', errorMessage('registerHandlers required'))
  assert(options.messageStore, errorMessage('messageStore required'))
  assert(options.category, errorMessage('category required'))
}
