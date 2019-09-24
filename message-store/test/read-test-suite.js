const createLog = require('../../test/test-log')
const {
  exampleCategory, examplePut, exampleStreamName
} = require('../examples')

exports.generateReadSuite = ({
  createMessageStore
}) => {
  let store, log
  const setup = (options = {}) => {
    log = createLog()
    store = createMessageStore({ log, ...options })
  }

  const read = async (...args) => {
    const found = []
    for await (const message of store.read(...args)) {
      found.push(message)
    }
    return found
  }

  describe('read', () => {
    describe('empty stream', () => {
      it('returns no records', async () => {
        setup()
        const streamNameNoExist = exampleStreamName()

        const found = await read(streamNameNoExist)

        expect(found).toHaveLength(0)
      })
    })

    describe('single item, one batch', () => {
      it('reads the item', async () => {
        setup()
        const { streamName, messages } = await examplePut(store, { count: 1, trackMessages: true })

        const found = await read(streamName, 0)

        expect(found).toHaveLength(1)
        expect(found[0].data).toEqual(messages[0].data)
      })
    })

    describe('many items, partial batch', () => {
      it('reads the items', async () => {
        setup({ batchSize: 10 })
        const { streamName, messages } = await examplePut(store, { count: 3, trackMessages: true })

        const found = await read(streamName, 0)

        expect(found).toHaveLength(3)
        expect(found[0].data).toEqual(messages[0].data)
        expect(found[1].data).toEqual(messages[1].data)
        expect(found[2].data).toEqual(messages[2].data)
      })
    })

    describe('many items, many batches', () => {
      it('reads the items', async () => {
        setup({ batchSize: 3 })
        const { streamName, messages } = await examplePut(store, { count: 10, trackMessages: true })

        const found = await read(streamName, 0)

        expect(found).toHaveLength(10)
        expect(found.map(f => f.data)).toEqual(messages.map(m => m.data))
      })
    })

    describe('category with multiple streams', () => {
      const writeCategoryMessages = async () => {
        const category = exampleCategory()

        const streamName1 = exampleStreamName(category)
        const { messages: messages1 } = await examplePut(store, {
          streamName: streamName1, trackMessages: true, count: 2
        })

        const streamName2 = exampleStreamName(category)
        const { messages: messages2 } = await examplePut(store, {
          streamName: streamName2, trackMessages: true, count: 2
        })

        return { category, messages1, messages2 }
      }

      describe('reading from category', () => {
        it('returns all messages from all streams in category', async () => {
          setup()
          const { category, messages1, messages2 } = await writeCategoryMessages()

          const found = await read(category)

          expect(found).toHaveLength(4)
          expect(found.map(f => f.data)).toEqual([
            messages1[0].data,
            messages1[1].data,
            messages2[0].data,
            messages2[1].data
          ])
        })
      })

      describe('reading from category with a position specified', () => {
        it('returns messages starting at the specified global position', async () => {
          setup()
          await examplePut(store) // write unrelated message

          const { category, messages1, messages2 } = await writeCategoryMessages()
          const all = await read(category)
          const subsetStartPosition = all[1].globalPosition

          const subset = await read(category, subsetStartPosition)

          expect(subset).toHaveLength(3)
          expect(subset.map(f => f.data)).toEqual([
            messages1[1].data,
            messages2[0].data,
            messages2[1].data
          ])
        })
      })

      describe('get from category', () => {
        it('reads a batch worth of items', async () => {
          setup({ batchSize: 1 })
          const { category, messages1 } = await writeCategoryMessages()

          const batch = await store.get(category)

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
        const saved = await examplePut(store, { count: 5, trackMessages: true })
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
          const found = await read(streamName, 2)

          expect(found).toHaveLength(3)
          expect(found[0].data).toEqual(messages[2].data)
          expect(found[1].data).toEqual(messages[3].data)
          expect(found[2].data).toEqual(messages[4].data)
        })
      })
    })
  })
}
