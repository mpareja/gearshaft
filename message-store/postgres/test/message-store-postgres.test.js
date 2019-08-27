const { generateGetLastSuite } = require('../../test/get-last-test-suite')
const { generateGetSuite } = require('../../test/get-test-suite')
const { generateReadSuite } = require('../../test/read-test-suite')
const { generateWriteSuite } = require('../../test/write-test-suite')
const {
  createStore, createMessageStoreDb, exampleLog, exampleStreamName
} = require('./init-message-store')

let db
beforeAll(async () => { db = await createMessageStoreDb() }, 8100) // 4s create postgres + 4s to migrate
afterAll(async () => { await db.close() })

const createMessageStore = (options) => createStore({ db, ...options })

describe('message-store-postgres', () => {
  generateGetLastSuite({ createMessageStore })
  generateGetSuite({ createMessageStore })
  generateReadSuite({ createMessageStore })
  generateWriteSuite({ createMessageStore })

  describe('get', () => {
    describe('connection error', () => {
      it('propagates error', async () => {
        const log = exampleLog()
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

  describe('get-last', () => {
    describe('connection error', () => {
      it('propagates error', async () => {
        const log = exampleLog()
        const store = createMessageStore({ log })

        // disconnect db used by _this_ test, but reset db used for other tests
        await db.end()
        db = await db.recreate()

        const promise = store.getLast(exampleStreamName())

        await expect(promise).rejects.toMatchObject({
          message: 'message-store getLast: error reading from database',
          inner: expect.anything()
        })
      })
    })
  })
})
