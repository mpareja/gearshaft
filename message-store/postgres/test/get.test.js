const {
  createStore, createLog, createMessageStoreDb,
  examplePut, exampleStreamName
} = require('./init-message-store')

let db
beforeAll(async () => { db = await createMessageStoreDb() }, 8100) // 4s create postgres + 4s to migrate
afterAll(async () => { await db.close() })

describe('get', () => {
  let store, log
  beforeEach(async () => {
    log = createLog()
    store = createStore({ db, log })
  })

  describe('connection error', () => {
    it('propagates error', async () => {
      // disconnect db used by _this_ test, but reset db used for other tests
      await db.end()
      db = await db.recreate()

      const promise = store.get(exampleStreamName())

      await expect(promise).rejects.toMatchObject({
        message: 'message-store get: error reading from database',
        inner: expect.anything()
      })
    })
  })

  describe('stream with no messages', () => {
    let streamName, results

    beforeEach(async () => {
      streamName = exampleStreamName()
      results = await store.get(streamName)
    })

    it('returns empty array', async () => {
      expect(results).toEqual([])
    })

    it('logs success', () => {
      expect(log.info).toHaveBeenCalledWith({
        batchSize: expect.any(Number),
        count: 0,
        position: 0,
        streamName: streamName
      }, 'message-store get: successful')
    })
  })

  describe('batch size', () => {
    describe('when not specified', () => {
      it('uses default value of 1000', async () => {
        await store.get(exampleStreamName())

        expect(log.info).toHaveBeenCalledWith(expect.objectContaining({
          batchSize: 1000
        }), expect.anything())
      })
    })

    describe('store with an overriden batch size', () => {
      const A_BATCH_SIZE = 2
      beforeEach(() => {
        store = createStore({ db, log, batchSize: A_BATCH_SIZE })
      })

      it('limits the results to the batch size', async () => {
        const { streamName } = await examplePut(store, { count: 3 })
        const results = await store.get(streamName)
        expect(results.length).toBe(A_BATCH_SIZE)
      })
    })

    describe('get with batch size specified', () => {
      it('limits the results to the batch size', async () => {
        const A_BATCH_SIZE = 2
        const { streamName } = await examplePut(store, { count: 4 })
        const results = await store.get(streamName, A_BATCH_SIZE)
        expect(results.length).toBe(A_BATCH_SIZE)
      })
    })
  })
})
