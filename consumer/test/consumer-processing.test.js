const createLog = require('../../test/test-log')
const promisify = require('util').promisify
const setImmediateP = promisify(setImmediate)
const {
  exampleConsumer,
  exampleHandler,
  exampleHandlerBlocking,
  exampleMessageClass,
  exampleMessageStore,
  exampleReadMessageData,
  exampleStreamName
} = require('../examples')

const HandledMessageClass = exampleMessageClass('HandledMessageClass')

const setupConsumerWithHandler = (opts = {}) => {
  const log = createLog()
  // log.enableDebugging()
  const streamName = exampleStreamName()
  const handler = opts.handler || exampleHandler()
  const messageData = exampleReadMessageData(HandledMessageClass)
  const registerHandlers = (register) => {
    register(HandledMessageClass, handler)
  }
  const store = exampleMessageStore()
  const consumer = exampleConsumer({
    log,
    pollingIntervalMs: 20, // keep test fast
    registerHandlers,
    store,
    streamName,
    ...opts
  })
  return { consumer, handler, log, messageData, store, streamName }
}

describe('given messages in store', () => {
  it('processes all messages in store', async () => {
    const { consumer, handler, store, streamName } = setupConsumerWithHandler()
    const first = exampleReadMessageData(HandledMessageClass)
    const second = exampleReadMessageData(HandledMessageClass)

    await store.write([first, second], streamName)

    const runner = consumer.start()

    while (handler.calls.length < 2) {
      await setImmediateP()
    }

    await runner.stop()

    expect(handler.calls).toMatchObject([first.data, second.data])
  })
})

describe('given all messages had been processed and a new message is saved', () => {
  it('processes the new message', async () => {
    const { consumer, handler, store, streamName } = setupConsumerWithHandler()
    const first = exampleReadMessageData(HandledMessageClass)
    const second = exampleReadMessageData(HandledMessageClass)

    await store.write([first, second], streamName)

    const runner = consumer.start()

    while (handler.calls.length < 2) {
      await setImmediateP()
    }

    const third = exampleReadMessageData(HandledMessageClass)
    await store.write(third, streamName)

    while (handler.calls.length < 3) {
      await setImmediateP()
    }

    await runner.stop()

    expect(handler.calls).toMatchObject([first.data, second.data, third.data])
  })
})

describe('given more messages than the highwater mark', () => {
  it('processes all messages', async () => {
    const { consumer, handler, store, streamName } = setupConsumerWithHandler({
      highWaterMark: 8,
      lowWaterMark: 2
    })

    const messages = new Array(10).fill().map(() => exampleReadMessageData(HandledMessageClass))
    await store.write(messages, streamName)

    const runner = consumer.start()

    while (handler.calls.length < 10) {
      await setImmediateP()
    }

    await runner.stop()

    expect(handler.calls).toMatchObject(messages.map(m => m.data))
  })
})

describe('given a slow message handler', () => {
  it('continue fetching batches until the highwater mark', async () => {
    const handler = exampleHandlerBlocking()
    const store = exampleMessageStore({ batchSize: 2 })
    const get = store.get
    store.get = jest.fn((...args) => get(...args))

    const { consumer, streamName } = setupConsumerWithHandler({
      handler,
      highWaterMark: 5,
      lowWaterMark: 2,
      store
    })

    const messages = new Array(10).fill().map(() => exampleReadMessageData(HandledMessageClass))
    await store.write(messages, streamName)

    const runner = consumer.start()

    while (store.get.mock.calls.length < 3) {
      await setImmediateP()
    }

    handler.resolve()

    await runner.stop()

    expect(store.get).toHaveBeenCalledTimes(3)
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
    const { consumer, messageData, store, streamName } = scenario

    await store.write(messageData, streamName)
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
