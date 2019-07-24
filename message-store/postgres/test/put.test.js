const createStore = require('../')
const createLog = require('./test-log')
const createMessageStoreDb = require('./create-message-store-db')
const {
  examplePut,
  exampleStreamName,
  exampleWriteMessageData
} = require('../examples')
const uuidValidate = require('uuid-validate')

let db
beforeAll(async () => { db = await createMessageStoreDb() }, 8100) // 4s create postgres + 4s to migrate
afterAll(async () => { await db.close() })

let store, log
const setup = async () => {
  log = createLog()
  store = createStore({ db, log })
}

describe('put', () => {
  beforeEach(setup)

  describe('single message', () => {
    let sharedLog, position, streamName, writeMessage

    beforeAll(async () => {
      await setup()
      sharedLog = log // preserve log used for assertions below
      streamName = exampleStreamName()
      writeMessage = exampleWriteMessageData()

      position = await store.put(writeMessage, streamName)
    })

    it('returns position as first message in stream', () => {
      expect(position).toBe(0)
    })

    it('logs success', () => {
      expect(sharedLog.info).toHaveBeenCalledWith({
        expectedVersion: undefined,
        id: writeMessage.id,
        position: 0,
        streamName: streamName,
        type: 'SomeType'
      }, 'message-store put: successful')
    })

    it('can be retrieved', async () => {
      const results = await store.get(streamName)
      expect(results).toHaveLength(1)
      expect(results[0]).toEqual({
        id: writeMessage.id,
        type: writeMessage.type,
        data: writeMessage.data,
        metadata: writeMessage.metadata,
        streamName,
        position,
        globalPosition: expect.any(Number),
        time: expect.any(Date)
      })
    })
  })

  describe('message with null body', () => {
    it('can be retrieved', async () => {
      const streamName = exampleStreamName()
      const writeMessage = exampleWriteMessageData()
      writeMessage.data = null

      const position = await store.put(writeMessage, streamName)

      const results = await store.get(streamName, position)
      const readMessage = results[0]

      expect(readMessage.data).toBeNull()
      expect(readMessage.metadata).toEqual(writeMessage.metadata)
    })
  })

  describe('message with no metadata', () => {
    it('can be retrieved', async () => {
      const streamName = exampleStreamName()
      const writeMessage = exampleWriteMessageData()
      writeMessage.metadata = null

      const position = await store.put(writeMessage, streamName)

      const results = await store.get(streamName, position)
      const readMessage = results[0]

      expect(readMessage.metadata).toBeNull()
      expect(readMessage.data).toEqual(writeMessage.data)
    })
  })

  describe('stream without id', () => {
    it('writes the category as the stream name', async () => {
      const streamName = exampleStreamName(null, 'none')
      await store.put(exampleWriteMessageData(), streamName)

      const readMessage = (await store.get(streamName))[0]

      expect(readMessage.streamName).toBe(streamName)
    })
  })

  describe('message without id', () => {
    it('generates id', async () => {
      const streamName = exampleStreamName()
      const writeMessage = exampleWriteMessageData()
      delete writeMessage.id
      await store.put(writeMessage, streamName)

      const readMessage = (await store.get(streamName))[0]

      expect(uuidValidate(readMessage.id)).toBe(true)
    })
  })

  describe('expected version', () => {
    describe('writing multiple messages in same category', () => {
      it('messages are written with the expected versions', async () => {
        const streamName = exampleStreamName()

        const wm0 = exampleWriteMessageData()
        await store.put(wm0, streamName)

        const wm1 = exampleWriteMessageData()
        await store.put(wm1, streamName)

        const readMessage = (await store.get(streamName, 1))[0]

        expect(readMessage.data).toEqual(wm1.data)
      })
    })

    describe('writing messages in different categories without ids', () => {
      it('messages are written with expected versions', async () => {
        const streamName0 = exampleStreamName(null, 'none')
        const wm0 = exampleWriteMessageData()
        await store.put(wm0, streamName0)

        const streamName1 = exampleStreamName(null, 'none')
        const wm1 = exampleWriteMessageData()
        await store.put(wm1, streamName1)

        const rm0 = (await store.get(streamName0, 0))[0]
        expect(rm0.data).toEqual(wm0.data)

        const rm1 = (await store.get(streamName1, 0))[0]
        expect(rm1.data).toEqual(wm1.data)
      })
    })

    describe('writing message with stale version', () => {
      let streamName, error
      beforeAll(async () => {
        streamName = exampleStreamName()
        const oldPosition = await store.put(exampleWriteMessageData(), streamName)
        await store.put(exampleWriteMessageData(), streamName)

        try {
          await store.put(exampleWriteMessageData(), streamName, oldPosition)
        } catch (e) {
          error = e
        }
      })

      it('results in an error', async () => {
        const expectedMessage = `message-store put: Wrong expected version: 0 (Stream: ${streamName}, Stream Version: 1)`
        expect(error).toEqual(new Error(expectedMessage))
        expect(store.isExpectedVersionError(error)).toBe(true)
      })

      it('does not write new message', async () => {
        const results = await store.get(streamName)
        expect(results.length).toBe(2)
      })
    })

    describe('stream exists and attempting to write message as first', () => {
      it('results in an error', async () => {
        const streamName = exampleStreamName()
        const wm0 = exampleWriteMessageData()
        await store.put(wm0, streamName)

        const wm1 = exampleWriteMessageData()

        let error
        try {
          await store.put(wm1, streamName, -1)
        } catch (e) {
          error = e
        }

        expect(error).toBeDefined()
        expect(store.isExpectedVersionError(error)).toBe(true)
      })
    })
  })

  describe('connection error', () => {
    it('propagates error', async () => {
      // disconnect db used by _this_ test, but reset db used for other tests
      await db.end()
      db = await db.recreate()

      const message = exampleWriteMessageData()
      const promise = store.put(message, exampleStreamName())

      await expect(promise).rejects.toMatchObject({
        message: 'message-store put: error writing to database',
        inner: expect.anything()
      })
    })
  })
})
describe('example-put', () => {
  beforeEach(setup)

  describe('given no count', () => {
    it('defaults to a single message', async () => {
      const { streamName, position } = await examplePut(store)

      const messages = await store.get(streamName)

      expect(position).toBe(0)
      expect(messages).toHaveLength(1)
    })
  })
})
