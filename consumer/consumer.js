const operationError = require('../errors/operation-error')
const delay = require('util').promisify(setTimeout)
const { createConsumerHandlerRegistry } = require('./consumer-handler-registry')
const { createPositionStore } = require('./position-store')
const { createRunner } = require('../runner')
const { throttleErrorLogging } = require('../logging')

exports.createConsumer = ({
  log,
  name,
  positionUpdateInterval = 100,
  registerHandlers,
  messageStore,
  category,
  strict = false,

  // TUNING
  highWaterMark = 500,
  lowWaterMark = 50,
  pollingIntervalMs = 100
}) => {
  const consumerError = operationError(`${name} consumer`)
  const prefix = (text) => `${name} consumer: ${text}`

  const positionStore = createPositionStore({ messageStore, streamName: category })
  let positionUpdateCount = 0

  const registry = createConsumerHandlerRegistry({ name, log, strict })
  registerHandlers(registry.register)

  const getLogMeta = (messageData) => {
    return {
      category,
      position: messageData.position,
      globalPosition: messageData.globalPosition,
      type: messageData.type
    }
  }

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
    const get = throttleErrorLogging(
      log,
      { category },
      prefix('error reading from stream'),
      prefix('reading from stream succeeded after encountering errors'),
      async (...args) => {
        return messageStore.get(...args)
      }
    )

    const getBatch = async (version) => {
      let batch
      try {
        batch = await get(category, version)
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
      } catch (e) {
        log.warn(getLogMeta(messageData), prefix('processing paused due to error (errorStrategy = "pause")'))
        runner.pause()
        queue.unshift(messageData) // place back in queue for retry if unpaused
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
