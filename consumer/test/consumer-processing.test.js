const { promisify } = require('util')
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
  const streamName = exampleStreamName()
  const handler = exampleHandler()
  const messageData = exampleReadMessageData(HandledMessageClass)
  const registerHandlers = (register) => {
    register(HandledMessageClass, handler)
  }
  const store = exampleMessageStore()
  const consumer = exampleConsumer({ registerHandlers, store, streamName, ...opts })
  return { consumer, handler, messageData, store, streamName }
}

describe('given messages in store', () => {
  it('processes all messages in store', async () => {
    const { consumer, handler, store, streamName } = setupConsumerWithHandler()
    const first = exampleReadMessageData(HandledMessageClass)
    const second = exampleReadMessageData(HandledMessageClass)

    await store.write([first, second], streamName)

    const runner = consumer.start()

    while (handler.calls.length < 2) {
      await promisify(setImmediate)()
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
      await promisify(setImmediate)()
    }

    const third = exampleReadMessageData(HandledMessageClass)
    await store.write(third, streamName)

    while (handler.calls.length < 3) {
      await promisify(setImmediate)()
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
      await promisify(setImmediate)()
    }

    await runner.stop()

    expect(handler.calls).toMatchObject(messages.map(m => m.data))
  })
})

describe('given a slow message handler', () => {
  it('continue fetching batches until the highwater mark', async () => {
    const handler = exampleHandlerBlocking()
    const registerHandlers = (register) => {
      register(HandledMessageClass, handler)
    }

    const store = exampleMessageStore({ batchSize: 2 })
    const get = store.get
    store.get = jest.fn((...args) => get(...args))

    const { consumer, streamName } = setupConsumerWithHandler({
      highWaterMark: 5,
      lowWaterMark: 2,
      store,
      registerHandlers
    })

    const messages = new Array(10).fill().map(() => exampleReadMessageData(HandledMessageClass))
    await store.write(messages, streamName)

    const runner = consumer.start()

    while (store.get.mock.calls.length < 3) {
      await promisify(setImmediate)()
    }

    handler.resolve()

    await runner.stop()

    expect(store.get).toHaveBeenCalledTimes(3)
  })
})
