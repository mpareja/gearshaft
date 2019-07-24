const createLog = require('./test-log')
const createMessageStoreDb = require('./create-message-store-db')
const createStore = require('../')
const {
  examplePut,
  exampleStreamName
} = require('../examples')

let db
beforeAll(async () => { db = await createMessageStoreDb() }, 8100) // 4s create postgres + 4s to migrate
afterAll(async () => { await db.close() })

let log
beforeEach(() => {
  log = createLog()
})

describe('pg', () => {
  describe('transaction', () => {
    describe('writing two messages in the same transaction', () => {
      it('both messages are stored', async () => {
        const streamName = exampleStreamName()

        await db.transaction(async (transaction) => {
          const transactionStore = createStore({ db: transaction, log })
          await examplePut(transactionStore, { streamName })
          await examplePut(transactionStore, { streamName })
        })

        const store = createStore({ db, log })
        const results = await store.get(streamName)

        expect(results).toHaveLength(2)
      })
    })

    describe('error during transaction after writing message', () => {
      let streamName, promise
      beforeEach(() => {
        streamName = exampleStreamName()

        promise = db.transaction(async (transaction) => {
          const transactionStore = createStore({ db: transaction, log })
          await examplePut(transactionStore, { streamName })
          throw new Error('bogus transaction error')
        })
      })

      it('message is not written (roll back)', async () => {
        try { await promise } catch (e) {}

        const store = createStore({ db, log })
        const results = await store.get(streamName)

        expect(results).toHaveLength(0)
      })

      it('propagates the error from the transaction', async () => {
        await expect(promise).rejects.toEqual(new Error('bogus transaction error'))
      })
    })
  })
})
