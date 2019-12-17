const createLog = require('../../test/test-log')
const {
  exampleCategory, examplePut, exampleStreamName
} = require('../examples')

exports.generateReadSuite = ({
  createMessageStore
}) => {
  let messageStore, log
  const setup = (options = {}) => {
    log = createLog()
    messageStore = createMessageStore({ log, ...options })
  }

  const read = async (...args) => {
    const found = []
    for await (const message of messageStore.read(...args)) {
      found.push(message)
    }
    return found
  }

  describe('read', () => {
    describe('entity stream', () => {
      describe('empty stream', () => {
        it('returns no records', async () => {
          setup()
          const streamNameNoExist = exampleStreamName()

          const found = await read(streamNameNoExist)

          expect(found).toHaveLength(0)
        })
      })

      describe('single message, full batch', () => {
        it('reads the message', async () => {
          setup({ batchSize: 1 })
          const { streamName, messages } = await examplePut(messageStore, { count: 1 })

          const found = await read(streamName, { position: 0 })

          expect(found).toHaveLength(1)
          expect(found[0].data).toEqual(messages[0].data)
        })
      })

      describe('many messages, partial batch', () => {
        it('reads the messages', async () => {
          setup({ batchSize: 10 })
          const { streamName, messages } = await examplePut(messageStore, { count: 3 })

          const found = await read(streamName, { position: 0 })

          expect(found).toHaveLength(3)
          expect(found[0].data).toEqual(messages[0].data)
          expect(found[1].data).toEqual(messages[1].data)
          expect(found[2].data).toEqual(messages[2].data)
        })
      })

      describe('many messages, many full batches and final partial batch', () => {
        it('reads the messages', async () => {
          setup({ batchSize: 3 })
          const { streamName, messages } = await examplePut(messageStore, { count: 10 })

          const found = await read(streamName, { position: 0 })

          expect(found).toHaveLength(10)
          expect(found.map(f => f.data)).toEqual(messages.map(m => m.data))
        })
      })
    })

    describe('category stream', () => {
      describe('empty category', () => {
        it('returns no records', async () => {
          setup()
          const categoryNoExist = exampleCategory()

          const found = await read(categoryNoExist)

          expect(found).toHaveLength(0)
        })
      })

      describe('multiple streams with 1 message, full batch', () => {
        it('reads the message', async () => {
          setup({ batchSize: 2 })
          const category = exampleCategory()

          const streamName1 = exampleStreamName(category)
          const { messages: [message1] } = await examplePut(messageStore, { streamName: streamName1 })

          const streamName2 = exampleStreamName(category)
          const { messages: [message2] } = await examplePut(messageStore, { streamName: streamName2 })

          const found = await read(category, { position: 0 })

          expect(found).toHaveLength(2)
          expect(found.map(f => f.data)).toEqual([
            message1.data,
            message2.data
          ])
        })
      })

      describe('multiple streams, partial batch', () => {
        it('reads the messages', async () => {
          setup({ batchSize: 10 })
          const category = exampleCategory()

          const { messages: messages1 } = await examplePut(messageStore,
            { streamName: category, count: 2 })
          const { messages: messages2 } = await examplePut(messageStore,
            { streamName: category, count: 2 })
          const { messages: messages3 } = await examplePut(messageStore,
            { streamName: category, count: 2 })

          const found = await read(category, { position: 0 })

          expect(found.map(f => f.data)).toEqual([
            ...messages1,
            ...messages2,
            ...messages3
          ].map(m => m.data))
        })
      })

      describe('multiple streams, many full batches and final partial batch', () => {
        it('reads the messages', async () => {
          setup({ batchSize: 3 })
          const category = exampleCategory()

          const { messages: messages1 } = await examplePut(messageStore,
            { streamName: category, count: 2 })
          const { messages: messages2 } = await examplePut(messageStore,
            { streamName: category, count: 2 })
          const { messages: messages3 } = await examplePut(messageStore,
            { streamName: category, count: 3 })
          const { messages: messages4 } = await examplePut(messageStore,
            { streamName: category, count: 3 })

          const found = await read(category, { position: 0 })

          expect(found).toHaveLength(10)
          expect(found.map(f => f.data)).toEqual([
            ...messages1,
            ...messages2,
            ...messages3,
            ...messages4
          ].map(m => m.data))
        })
      })
    })

    describe('category with multiple interleaving streams', () => {
      const examplePutSingle = async (streamName) => {
        const { messages } = await examplePut(messageStore, { streamName })
        return messages[0]
      }

      const writeCategoryMessages = async () => {
        const category = exampleCategory()

        const messages1 = []
        const streamName1 = exampleStreamName(category)

        const messages2 = []
        const streamName2 = exampleStreamName(category)

        messages1.push(await examplePutSingle(streamName1))
        messages2.push(await examplePutSingle(streamName2))
        messages2.push(await examplePutSingle(streamName2))

        messages1.push(await examplePutSingle(streamName1))
        messages2.push(await examplePutSingle(streamName2))

        return { category, messages1, messages2 }
      }

      describe('reading from category', () => {
        it('returns all messages from all streams in category', async () => {
          setup({ batchSize: 1 })
          const { category, messages1, messages2 } = await writeCategoryMessages()

          const found = await read(category)

          expect(found).toHaveLength(5)
          expect(found.map(f => f.data)).toEqual([
            messages1[0].data,
            messages2[0].data,
            messages2[1].data,
            messages1[1].data,
            messages2[2].data
          ])
        })
      })

      describe('reading from category with a position specified', () => {
        it('returns messages starting at the specified global position', async () => {
          setup({ batchSize: 1 })
          await examplePut(messageStore) // write unrelated message

          const { category, messages1, messages2 } = await writeCategoryMessages()
          const all = await read(category)
          const subsetStartPosition = all[2].globalPosition

          const subset = await read(category, { position: subsetStartPosition })

          expect(subset).toHaveLength(3)
          expect(subset.map(f => f.data)).toEqual([
            messages2[1].data,
            messages1[1].data,
            messages2[2].data
          ])
        })
      })

      describe('get from category', () => {
        it('reads a batch worth of messages', async () => {
          setup({ batchSize: 1 })
          const { category, messages1 } = await writeCategoryMessages()

          const batch = await messageStore.get(category)

          expect(batch).toHaveLength(1)
          expect(batch.map(f => f.data)).toEqual([
            messages1[0].data
          ])
        })
      })
    })

    describe('position', () => {
      let streamName, messages
      beforeAll(async () => {
        setup()
        const saved = await examplePut(messageStore, { count: 5 })
        streamName = saved.streamName
        messages = saved.messages
      })

      describe('no position defined', () => {
        it('starts from beginning of stream (position 0)', async () => {
          const found = await read(streamName)

          expect(found).toHaveLength(5)
          expect(found.map(f => f.data)).toEqual(messages.map(m => m.data))
        })
      })

      describe('position specified', () => {
        it('only returns records from the specified position', async () => {
          const found = await read(streamName, { position: 2 })

          expect(found).toHaveLength(3)
          expect(found[0].data).toEqual(messages[2].data)
          expect(found[1].data).toEqual(messages[3].data)
          expect(found[2].data).toEqual(messages[4].data)
        })
      })
    })
  })
}
