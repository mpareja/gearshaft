const createTestLog = require('../../../test/test-log')
const { generateGetCategorySuite } = require('../../test/get-category-test-suite')
const { generateGetLastSuite } = require('../../test/get-last-test-suite')
const { generateGetStreamSuite } = require('../../test/get-stream-test-suite')
const { generateGetSuite } = require('../../test/get-test-suite')
const { generatePutSuite } = require('../../test/put-test-suite')
const { generateReadSuite } = require('../../test/read-test-suite')
const { generateWriteSuite } = require('../../test/write-test-suite')
const { getConfig } = require('../../../postgres-gateway/test/config')
const {
  createStore, createTestPostgresGateway, examplePut,
  exampleStreamName, exampleWriteMessageData
} = require('./init-message-store')

let db
beforeAll(() => { db = createTestPostgresGateway() })
afterAll(async () => { await db.end() })

const createMessageStore = (options) => createStore({ db, ...options })

describe('message-store-postgres', () => {
  generateGetCategorySuite({ createMessageStore })
  generateGetStreamSuite({ createMessageStore })
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
      const databaseSettings = getConfig().db
      const messageStore = require('../').createMessageStore(databaseSettings)

      await messageStore.getLast(exampleStreamName())
    })
  })

  describe('transactions', () => {
    describe('concurrently writing to two different streams', () => {
      it('messages are written to both streams', async () => {
        const streamName1 = exampleStreamName()
        const streamName2 = exampleStreamName()

        await db.transaction(async (tx1) => {
          const store1 = createStore({ db: tx1 })
          await examplePut(store1, { streamName: streamName1 })

          await db.transaction(async (tx2) => {
            const store2 = createStore({ db: tx2 })
            await examplePut(store1, { streamName: streamName1 })
            await examplePut(store2, { streamName: streamName2 })
          })

          await examplePut(store1, { streamName: streamName1 })
        })

        const messageStore = createStore({ db })
        const results1 = await messageStore.get(streamName1)
        const results2 = await messageStore.get(streamName2)

        expect(results1).toHaveLength(3)
        expect(results2).toHaveLength(1)
      })
    })

    describe('concurrently writing to the same stream', () => {
      it('results in blocking until 1st transaction completes', async () => {
        const streamName = exampleStreamName()
        const states = []
        let resolveBlock
        const block = new Promise(resolve => { resolveBlock = resolve })

        let promise2
        const promise1 = db.transaction(async (tx1) => {
          const store1 = createStore({ db: tx1 })
          await examplePut(store1, { streamName })

          promise2 = db.transaction(async (tx2) => {
            const store2 = createStore({ db: tx2 })
            await examplePut(store2)
            states.push('before write')
            await examplePut(store2, { streamName })
            states.push('blocked stream written')
          })

          states.push('before block')
          await block
          states.push('after block')
        })

        const delay = require('util').promisify(setTimeout)
        states.push('before delay')
        await delay(50)
        states.push('after delay')

        // show that a write ought to have finished
        const messageStore = createStore({ db })
        await examplePut(messageStore)
        states.push('unblocked stream written')

        resolveBlock()
        await promise1
        await promise2

        expect(states).toEqual([
          'before delay',
          'before block',
          'before write',
          'after delay',
          'unblocked stream written',
          'after block',
          'blocked stream written'
        ])

        const results = await messageStore.get(streamName)
        expect(results).toHaveLength(2)
      })
    })
  })
})
