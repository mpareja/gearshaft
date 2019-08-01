const {
  createStore, createLog, createMessageStoreDb,
  examplePut, exampleStreamName
} = require('./init-message-store')

let db
beforeAll(async () => { db = await createMessageStoreDb() }, 8100) // 4s create postgres + 4s to migrate
afterAll(async () => { await db.close() })

let store, log
const setup = (options = {}) => {
  log = createLog()
  store = createStore({ db, log, ...options })
}

describe('read', () => {
  describe('empty stream', () => {
    it('returns no records', async () => {
      setup()
      const streamNameNoExist = exampleStreamName()
      const found = []

      for await (const record of store.read(streamNameNoExist)) {
        found.push(record)
      }

      expect(found).toHaveLength(0)
    })
  })

  describe('single item, one batch', () => {
    it('reads the item', async () => {
      setup()
      const { streamName, messages } = await examplePut(store, { count: 1, trackMessages: true })
      const found = []

      for await (const record of store.read(streamName, 0)) {
        found.push(record)
      }

      expect(found).toHaveLength(1)
      expect(found[0].data).toEqual(messages[0].data)
    })
  })

  describe('many items, one batch', () => {
    it('reads the item', async () => {
      setup({ batchSize: 10 })
      const { streamName, messages } = await examplePut(store, { count: 3, trackMessages: true })
      const found = []

      for await (const record of store.read(streamName, 0)) {
        found.push(record)
      }

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
      const found = []

      for await (const record of store.read(streamName, 0)) {
        found.push(record)
      }

      expect(found).toHaveLength(10)
      expect(found.map(f => f.data)).toEqual(messages.map(m => m.data))
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
        const found = []

        for await (const record of store.read(streamName)) {
          found.push(record)
        }

        expect(found).toHaveLength(5)
        expect(found.map(f => f.data)).toEqual(messages.map(m => m.data))
      })
    })

    describe('position specified', () => {
      it('only returns records from the specified position', async () => {
        const found = []

        for await (const record of store.read(streamName, 2)) {
          found.push(record)
        }

        expect(found).toHaveLength(3)
        expect(found[0].data).toEqual(messages[2].data)
        expect(found[1].data).toEqual(messages[3].data)
        expect(found[2].data).toEqual(messages[4].data)
      })
    })
  })
})
