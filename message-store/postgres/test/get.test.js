const {
  createStore, createLog, createMessageStoreDb, exampleStreamName
} = require('./init-message-store')

let db
beforeAll(async () => { db = await createMessageStoreDb() }, 8100) // 4s create postgres + 4s to migrate
afterAll(async () => { await db.close() })

const createMessageStore = (options) => createStore({ db, ...options })

describe('message-store-postgres', () => {
  describe('get', () => {
    describe('connection error', () => {
      it('propagates error', async () => {
        const log = createLog()
        const store = createMessageStore({ log })

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
  })
})
