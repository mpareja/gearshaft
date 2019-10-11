const createClock = require('./fake-clock')
const createLog = require('../../test/test-log')
const promisify = require('util').promisify
const setImmediateP = promisify(setImmediate)
const {
  exampleCategory, exampleMessageStore, exampleWriteMessageData, exampleStreamName
} = require('../../message-store')
const { exampleConsumer, exampleHandler, exampleHandlerBlocking } = require('../examples')
const { exampleMessageClass } = require('../../messaging')

const HandledMessageClass = exampleMessageClass('HandledMessageClass')

const setupConsumerWithHandler = (opts = {}) => {
  const log = createLog()
  // log.enableDebugging()
  const category = opts.category || exampleCategory()
  const handler = opts.handler || exampleHandler()
  const messageData = exampleWriteMessageData({ type: HandledMessageClass.name })
  const registerHandlers = (register) => {
    register(HandledMessageClass, handler)
  }
  const messageStore = exampleMessageStore({ log })
  const consumer = exampleConsumer({
    log,
    pollingIntervalMs: 20, // keep test fast
    registerHandlers,
    messageStore,
    category,
    ...opts
  })
  return { consumer, handler, log, messageData, messageStore, category }
}

describe('given messages in store', () => {
  it('processes all messages in store', async () => {
    const { consumer, handler, messageStore, category } = setupConsumerWithHandler()
    const first = exampleWriteMessageData({ type: HandledMessageClass.name })
    const second = exampleWriteMessageData({ type: HandledMessageClass.name })

    await messageStore.write([first, second], exampleStreamName(category))

    const runner = consumer.start()
    await handler.waitUntilCalledAtLeast(2)
    await runner.stop()

    expect(handler.calls).toMatchObject([first.data, second.data])
  })
})

describe('given all messages had been processed and a new message is written', () => {
  it('processes the new message', async () => {
    const { consumer, handler, messageStore, category } = setupConsumerWithHandler()
    const first = exampleWriteMessageData({ type: HandledMessageClass.name })
    const second = exampleWriteMessageData({ type: HandledMessageClass.name })
    const streamName = exampleStreamName(category)

    // setup all messages processed
    await messageStore.write([first, second], streamName)
    const runner = consumer.start()
    await handler.waitUntilCalledAtLeast(2)

    // setup third message written
    const third = exampleWriteMessageData({ type: HandledMessageClass.name })
    await messageStore.write(third, streamName)

    // assert third message is processed
    await handler.waitUntilCalledAtLeast(3)
    await runner.stop()
    expect(handler.calls).toMatchObject([first.data, second.data, third.data])
  })
})

describe('given some messages had been processed and consumer is restarting', () => {
  it('continues processing where it left off', async () => {
    const { consumer, handler, messageStore, category } = setupConsumerWithHandler({ positionUpdateInterval: 1 })
    const first = exampleWriteMessageData({ type: HandledMessageClass.name })
    const second = exampleWriteMessageData({ type: HandledMessageClass.name })

    await messageStore.write([first, second], exampleStreamName(category))

    // process first message and stop the consumer
    let runner = consumer.start()
    await handler.waitUntilCalled()
    await runner.stop()

    // restart the consumer
    runner = consumer.start()

    // assert it processes the next message
    await handler.waitUntilCalledAtLeast(2)
    await runner.stop()
    expect(handler.calls).toMatchObject([first.data, second.data])
  })
})

describe('given more messages than the highwater mark', () => {
  it('processes all messages', async () => {
    const { consumer, handler, messageStore, category } = setupConsumerWithHandler({
      highWaterMark: 8,
      lowWaterMark: 2
    })

    const messages = new Array(10).fill().map(() => exampleWriteMessageData({ type: HandledMessageClass.name }))
    await messageStore.write(messages, exampleStreamName(category))

    const runner = consumer.start()

    await handler.waitUntilCalledAtLeast(10)
    await runner.stop()
    expect(handler.calls).toMatchObject(messages.map(m => m.data))
  })
})

describe('given a slow message handler', () => {
  it('continue fetching batches until the highwater mark', async () => {
    const handler = exampleHandlerBlocking()
    const messageStore = exampleMessageStore({ batchSize: 2 })
    const get = messageStore.get
    messageStore.get = jest.fn((...args) => get(...args))

    const { consumer, category } = setupConsumerWithHandler({
      handler,
      highWaterMark: 5,
      lowWaterMark: 2,
      messageStore
    })

    const messages = new Array(10).fill().map(() => exampleWriteMessageData({ type: HandledMessageClass.name }))
    await messageStore.write(messages, exampleStreamName(category))

    const runner = consumer.start()

    while (messageStore.get.mock.calls.length < 3) {
      await setImmediateP()
    }

    handler.resolve()

    await runner.stop()

    expect(messageStore.get).toHaveBeenCalledTimes(3)
  })
})

describe('given a handler exception', () => {
  let runner
  afterEach(async () => {
    if (runner) {
      await runner.stop()
    }
  })

  const setupConsumerWithBlockedHandler = async (opts = {}) => {
    const handler = exampleHandlerBlocking()
    const scenario = setupConsumerWithHandler({ handler, ...opts })
    const { consumer, messageData, messageStore, category } = scenario

    await messageStore.write(messageData, exampleStreamName(category))
    runner = consumer.start()
    await handler.waitUntilCalled()

    return { ...scenario, handler }
  }

  const waitForPause = async () => {
    while (!runner.stats().paused) {
      await setImmediateP()
    }
  }

  it('consumer pauses', async () => {
    const { handler } = await setupConsumerWithBlockedHandler()

    handler.reject(new Error('handler error'))

    await waitForPause()
  })

  it('log indicates error handling strategy', async () => {
    const { handler, log } = await setupConsumerWithBlockedHandler({ name: 'MyConsumer' })

    handler.reject(new Error('handler error'))

    await runner.stop()

    expect(log.warn).toHaveBeenCalledWith(expect.anything(),
      'MyConsumer consumer: processing paused due to error (errorStrategy = "pause")')
  })

  it('unpausing runner retries the same message', async () => {
    const { handler } = await setupConsumerWithBlockedHandler({ name: 'MyConsumer' })

    handler.reject(new Error('handler error'))
    await waitForPause()

    runner.unpause()

    await handler.waitUntilCalledAtLeast(2)

    handler.resolve()

    await runner.stop()
  })
})

describe('given an error while fetching messages', () => {
  const setupFetchError = async (opts) => {
    const scenario = await setupConsumerWithHandler(opts)
    const { consumer, messageStore } = scenario
    messageStore.get = jest.fn(async () => {
      await setImmediateP()
      throw new Error('get error')
    })

    const runner = consumer.start()
    return { ...scenario, runner }
  }

  it('retries the fetch', async () => {
    const { runner, messageStore } = await setupFetchError()

    while (messageStore.get.mock.calls.length < 2) {
      await setImmediateP()
    }

    await runner.stop()
  })

  it('logs the error', async () => {
    const { log, runner, messageStore, category } = await setupFetchError({
      name: 'MyConsumer'
    })

    while (messageStore.get.mock.calls.length < 1) {
      await setImmediateP()
    }

    await runner.stop()

    expect(log.error).toHaveBeenCalledWith({
      category,
      err: new Error('get error'),
      errorCount: 1
    }, 'MyConsumer consumer: error reading from stream')
  })

  it('waits 10s before logging the error again', async () => {
    const clock = createClock()
    const { log, runner, messageStore, category } = await setupFetchError({
      name: 'MyConsumer',
      clock
    })

    while (messageStore.get.mock.calls.length < 2) {
      await setImmediateP()
    }
    await runner.pause() // wait for inflight messageStore.get call to complete

    clock.plusSeconds(10)

    runner.unpause()

    while (messageStore.get.mock.calls.length < 3) {
      await setImmediateP()
    }
    await runner.stop()

    // expect: log failure, no log, log failure
    expect(messageStore.get).toHaveBeenCalledTimes(3)
    expect(log.error).toHaveBeenCalledTimes(2) /// only logged 2 of 3 times
    expect(log.error).toHaveBeenCalledWith({
      category,
      err: new Error('get error'),
      errorCount: 3
    }, 'MyConsumer consumer: error reading from stream')
  })

  it('logs when fetching starts working again', async () => {
    const { log, runner, messageStore, category } = await setupFetchError({
      name: 'MyConsumer'
    })

    while (messageStore.get.mock.calls.length < 1) {
      await setImmediateP()
    }
    await runner.pause() // wait for inflight messageStore.get call to complete

    // setup messageStore to no longer raise error
    messageStore.get = jest.fn(async () => {
      await setImmediateP()
      return []
    })

    runner.unpause()

    while (messageStore.get.mock.calls.length < 1) { // new messageStore.get instance
      await setImmediateP()
    }
    await runner.stop()

    expect(log.info).toHaveBeenCalledWith({ category, errorCount: 1 },
      'MyConsumer consumer: reading from stream succeeded after encountering errors')
  })
})
