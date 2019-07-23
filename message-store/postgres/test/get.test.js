const createGet = require('../get')
const createLog = require('./test-log')
const createMessageStoreDb = require('./create-message-store-db')
const { exampleStreamName } = require('../examples')

describe('get', () => {
  let db, get, log

  beforeAll(async () => { db = await createMessageStoreDb() }, 8100) // 4s create postgres + 4s to migrate
  afterAll(async () => { await db.close() })

  beforeEach(async () => {
    log = createLog()
    get = createGet({ db, log })
  })

  describe('connection error', () => {
    it('propagates error', async () => {
      // disconnect db used by _this_ test, but reset db used for other tests
      await db.end()
      db = await db.recreate()

      const promise = get(exampleStreamName())

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
      results = await get(streamName)
    })

    it('returns empty array', async () => {
      expect(results).toEqual([])
    })

    it('logs success', () => {
      expect(log.info).toHaveBeenCalledWith({
        batchSize: 1000,
        count: 0,
        position: 0,
        streamName: streamName
      }, 'message-store get: successful')
    })
  })
})
