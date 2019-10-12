const createTestLog = require('../../../test/test-log')
const { generateGetLastSuite } = require('../../test/get-last-test-suite')
const { generateGetSuite } = require('../../test/get-test-suite')
const { generatePutSuite } = require('../../test/put-test-suite')
const { generateReadSuite } = require('../../test/read-test-suite')
const { generateWriteSuite } = require('../../test/write-test-suite')
const {
  createStore, createMessageStoreDb, exampleStreamName,
  exampleWriteMessageData
} = require('./init-message-store')

let db
beforeAll(() => { db = createMessageStoreDb() })
afterAll(async () => { await db.close() })

const createMessageStore = (options) => createStore({ db, ...options })

describe('message-store-postgres', () => {
  generateGetLastSuite({ createMessageStore })
  generateGetSuite({ createMessageStore })
  generatePutSuite({ createMessageStore })
  generateReadSuite({ createMessageStore })
  generateWriteSuite({ createMessageStore })

  describe('get', () => {
    describe('connection error', () => {
      it('propagates error', async () => {
        const log = createTestLog()
        const messageStore = createMessageStore({ log })

        // disconnect db used by _this_ test, but reset db used for other tests
        await db.end()
        db = await db.recreate()

        const promise = messageStore.get(exampleStreamName())

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
        const log = createTestLog()
        const messageStore = createMessageStore({ log })

        // disconnect db used by _this_ test, but reset db used for other tests
        await db.end()
        db = await db.recreate()

        const promise = messageStore.getLast(exampleStreamName())

        await expect(promise).rejects.toMatchObject({
          message: 'message-store getLast: error reading from database',
          inner: expect.anything()
        })
      })
    })
  })

  describe('put', () => {
    describe('connection error', () => {
      it('propagates error', async () => {
        const log = createTestLog()
        const messageStore = createMessageStore({ log })

        // disconnect db used by _this_ test, but reset db used for other tests
        await db.end()
        db = await db.recreate()

        const message = exampleWriteMessageData()
        const promise = messageStore.put(message, exampleStreamName())

        await expect(promise).rejects.toMatchObject({
          message: 'message-store put: error writing to database: Cannot use a pool after calling end on the pool',
          inner: expect.anything()
        })
      })
    })
  })

  describe('given connection settings rather than a connection object', () => {
    it('creates own usable connection', async () => {
      const log = createTestLog()
      const getConfig = require('./config')
      const settings = getConfig().db
      const messageStore = require('../').createMessageStore({ ...settings, log })

      await messageStore.getLast(exampleStreamName())
    })
  })
})
