const promisify = require('util').promisify
const setImmediateP = promisify(setImmediate)
const { exampleHandlerBlocking } = require('../examples')
const { exampleMessageStore, exampleWriteMessageData, exampleStreamName } = require('../../message-store')
const { HandledMessageClass, setupConsumerWithHandler } = require('./setup-consumer-with-handler')

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
    const getCategory = messageStore.getCategory
    messageStore.getCategory = jest.fn((...args) => getCategory(...args))

    const { consumer, category } = setupConsumerWithHandler({
      handler,
      highWaterMark: 5,
      lowWaterMark: 2,
      messageStore
    })

    const messages = new Array(10).fill().map(() => exampleWriteMessageData({ type: HandledMessageClass.name }))
    await messageStore.write(messages, exampleStreamName(category))

    const runner = consumer.start()

    while (messageStore.getCategory.mock.calls.length < 3) {
      await setImmediateP()
    }

    handler.resolve()

    await runner.stop()

    expect(messageStore.getCategory).toHaveBeenCalledTimes(3)
  })
})

describe('handler exceptions', () => {
  let runner
  afterEach(async () => {
    if (runner) {
      await runner.stop()
    }
  })

  const setupConsumerWithBlockedHandler = async (opts = {}) => {
    const handler = exampleHandlerBlocking()
    const messageData = exampleWriteMessageData({ type: HandledMessageClass.name })
    const scenario = setupConsumerWithHandler({ handler, ...opts })
    const { consumer, messageStore, category } = scenario

    await messageStore.write(messageData, exampleStreamName(category))
    runner = consumer.start()
    await handler.waitUntilCalled()

    return { ...scenario, handler, messageData }
  }

  const waitForPause = async () => {
    while (!runner.stats().paused) {
      await setImmediateP()
    }
  }

  // The following tests are skipped because they ultimately fail
  // due to the consumer intentionally raising an unhandled exception.
  //
  // The tests are beneficial because the assertions are performed
  // correctly, even if the test ultimately fails with "handler
  // raised an error" exceptions. Please run them manual when changing
  // the consumer error handling
  describe.skip('given a handler exception and default crash-stop error strategy', () => {
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
        'MyConsumer consumer: processing paused due to error')

      const logMetadata = log.warn.mock.calls[0][0]
      expect(logMetadata.err).toBeDefined()
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

  describe('given a handler exception and a custom error strategy', () => {
    it('calls the custom error strategy', async () => {
      const errorStrategy = jest.fn()
      const { handler, messageData } = await setupConsumerWithBlockedHandler({ errorStrategy })

      const error = new Error('handler error')
      handler.reject(error)

      await runner.stop()

      expect(errorStrategy).toHaveBeenCalled()

      const [foundError, foundMessageData, dispatch] = errorStrategy.mock.calls[0]
      expect(foundError).toBeInstanceOf(Error)
      expect(foundError.inner).toBe(error)
      expect(foundMessageData.id).toBe(messageData.id)
      expect(dispatch).toEqual(expect.any(Function))
    })
  })
})

describe('given an error while fetching messages', () => {
  const setupFetchError = async (opts) => {
    const scenario = await setupConsumerWithHandler(opts)
    const { consumer, messageStore } = scenario
    messageStore.getCategory = jest.fn(async () => {
      await setImmediateP()
      throw new Error('getCategory error')
    })

    const runner = consumer.start()
    return { ...scenario, runner }
  }

  it('retries the fetch', async () => {
    const { runner, messageStore } = await setupFetchError()

    while (messageStore.getCategory.mock.calls.length < 2) {
      await setImmediateP()
    }

    await runner.stop()
  })

  it('logs the error', async () => {
    const { log, runner, messageStore, category } = await setupFetchError({
      name: 'MyConsumer'
    })

    while (messageStore.getCategory.mock.calls.length < 1) {
      await setImmediateP()
    }

    await runner.stop()

    expect(log.error).toHaveBeenCalledWith({
      category,
      err: new Error('getCategory error')
    }, 'MyConsumer consumer: error reading from stream')
  })
})

describe('given an error fetching initial consumer position', () => {
  const setupGetPositionError = async (opts) => {
    const scenario = await setupConsumerWithHandler(opts)
    const { consumer, messageStore } = scenario
    messageStore.getLast = jest.fn(async () => {
      await setImmediateP()
      throw new Error('getLast error')
    })

    const runner = consumer.start()
    return { ...scenario, runner }
  }

  it('logs the error', async () => {
    const name = 'MyConsumer'
    const { category, log, messageStore, runner } = await setupGetPositionError({
      name
    })

    while (messageStore.getLast.mock.calls.length < 1) {
      await setImmediateP()
    }

    await runner.stop()

    expect(log.error).toHaveBeenCalledWith(
      { category, err: expect.anything(), name },
      'MyConsumer consumer: error reading consumer start position')
  })

  it('retries the fetch', async () => {
    const { messageStore, runner } = await setupGetPositionError()

    while (messageStore.getLast.mock.calls.length < 2) {
      await setImmediateP()
    }

    await runner.stop()
  }, 500) // fail if doesn't happen very quickly
})
