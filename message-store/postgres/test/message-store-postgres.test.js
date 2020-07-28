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
  createStore, createTestPostgresGateway, examplePut, examplePutCategory,
  exampleStreamName, exampleWriteMessageData
} = require('./init-message-store')

const delay = require('util').promisify(setTimeout)

let postgresGateway
beforeAll(() => { postgresGateway = createTestPostgresGateway() })
afterAll(async () => { await postgresGateway.end() })

const createMessageStore = (options) => createStore({ postgresGateway, ...options })

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

        // disconnect gateway used by _this_ test, but reset gateway used for other tests
        await postgresGateway.end()
        postgresGateway = await postgresGateway.recreate()

        const promise = messageStore.get(exampleStreamName())

        await expect(promise).rejects.toMatchObject({
          message: 'message-store get: error reading from database',
          inner: expect.anything()
        })
      })
    })
  })

  describe('get-stream', () => {
    describe('sql condition', () => {
      describe('when not provided', () => {
        it('returns all results', async () => {
          const log = createTestLog()
          const messageStore = createMessageStore({ log })
          const { streamName } = await examplePut(messageStore, { count: 3 })

          const results = await messageStore.getStream(streamName)

          expect(results.length).toBe(3)
        })
      })

      describe('when provided', () => {
        it('limits the results based on given sql condition', async () => {
          const log = createTestLog()
          const messageStore = createMessageStore({ log })
          const { streamName, messages } = await examplePut(messageStore, { count: 3, trackMessages: true })

          const CONDITION_SQL = 'messages.position = 1'
          const results = await messageStore.getStream(streamName, { condition: CONDITION_SQL })

          expect(results.length).toBe(1)
          expect(results[0]).toMatchObject(messages[1])
        })
      })
    })
  })

  describe('get-category', () => {
    describe('sql condition', () => {
      describe('when not provided', () => {
        it('returns all results', async () => {
          const log = createTestLog()
          const messageStore = createMessageStore({ log })
          const { category } = await examplePutCategory(messageStore, { count: 3 })

          const results = await messageStore.getCategory(category)

          expect(results.length).toBe(3)
        })
      })

      describe('when provided', () => {
        it('limits the results based on given sql condition', async () => {
          const log = createTestLog()
          const messageStore = createMessageStore({ log })
          const { category, messages } = await examplePutCategory(messageStore, { count: 3, trackMessages: true })

          const expectedMessage = messages[2]

          const CONDITION_SQL = `messages.id = '${expectedMessage.id}'`
          const results = await messageStore.getCategory(category, { condition: CONDITION_SQL })

          expect(results.length).toBe(1)
          expect(results[0]).toMatchObject(expectedMessage)
        })
      })
    })
  })

  describe('get-last', () => {
    describe('connection error', () => {
      it('propagates error', async () => {
        const log = createTestLog()
        const messageStore = createMessageStore({ log })

        // disconnect gateway used by _this_ test, but reset gateway used for other tests
        await postgresGateway.end()
        postgresGateway = await postgresGateway.recreate()

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

        // disconnect gateway used by _this_ test, but reset gateway used for other tests
        await postgresGateway.end()
        postgresGateway = await postgresGateway.recreate()

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

      await databaseSettings.postgresGateway.end()
    })

    it('logs connection pool errors (since application cannot log errors directly)', async () => {
      const databaseSettings = getConfig().db
      const log = createTestLog()
      const config = { ...databaseSettings, log }
      require('../').createMessageStore(config)

      // 1. reserve connection that will do the termination
      const reaperConnection = await config.postgresGateway.connect()

      // 2. grab pid for connection that will be terminated
      const result = await config.postgresGateway.query('SELECT pg_backend_pid() as pid')
      const { pid } = result.rows[0]

      // 3. terminate the other connection
      await reaperConnection.query('SELECT pg_backend_pid() as pid, pg_terminate_backend($1::int)', [pid])
      await reaperConnection.release()

      // 4. cleanup
      await config.postgresGateway.end()

      await delay(100) // give termination of other pid a chance to be noticed

      expect(log.error).toHaveBeenCalledWith({ err: expect.any(Error) },
        'message-store: postgres connection error')

      // ensure credentials aren't exposed to logs
      // https://github.com/brianc/node-postgres/issues/1568
      const error = log.error.mock.calls[0][0]
      expect(containsValue(error, databaseSettings.password)).toBe(false)
    })
  })

  describe('transactions', () => {
    describe('concurrently writing to two different streams', () => {
      it('messages are written to both streams', async () => {
        const streamName1 = exampleStreamName()
        const streamName2 = exampleStreamName()

        await postgresGateway.transaction(async (tx1) => {
          const store1 = createStore({ postgresGateway: tx1 })
          await examplePut(store1, { streamName: streamName1 })

          await postgresGateway.transaction(async (tx2) => {
            const store2 = createStore({ postgresGateway: tx2 })
            await examplePut(store1, { streamName: streamName1 })
            await examplePut(store2, { streamName: streamName2 })
          })

          await examplePut(store1, { streamName: streamName1 })
        })

        const messageStore = createStore({ postgresGateway })
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
        const promise1 = postgresGateway.transaction(async (tx1) => {
          const store1 = createStore({ postgresGateway: tx1 })
          await examplePut(store1, { streamName })

          promise2 = postgresGateway.transaction(async (tx2) => {
            const store2 = createStore({ postgresGateway: tx2 })
            await examplePut(store2)
            states.push('before write')
            await examplePut(store2, { streamName })
            states.push('blocked stream written')
          })

          states.push('before block')
          await block
          states.push('after block')
        })

        states.push('before delay')
        await delay(50)
        states.push('after delay')

        // show that a write ought to have finished
        const messageStore = createStore({ postgresGateway })
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

const containsValue = (obj, value) => {
  if (obj === value) {
    return true
  }

  if (!obj) {
    return false
  }

  if (obj instanceof Array) {
    return obj.some((entry) => containsValue(entry, value))
  }

  if (typeof obj === 'object') {
    return Object.values(obj).some((entry) => containsValue(entry, value))
  }

  return false
}
