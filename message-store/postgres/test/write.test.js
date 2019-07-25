const {
  createStore, createLog, createMessageStoreDb, exampleStreamName,
  exampleWriteMessageData
} = require('./init-message-store')
const createWrite = require('../write')

let db
beforeAll(async () => { db = await createMessageStoreDb() }, 8100) // 4s create postgres + 4s to migrate
afterAll(async () => { await db.close() })

let store, log
const setup = async () => {
  log = createLog()
  store = createStore({ db, log })
}

describe('write', () => {
  describe('single message', () => {
    let position, streamName, writeMessage
    beforeEach(async () => {
      setup()
      streamName = exampleStreamName()
      writeMessage = exampleWriteMessageData()
      position = await store.write(writeMessage, streamName)
    })

    it('is written', async () => {
      const [readMessage] = await store.get(streamName, position)
      expect(readMessage).toBeDefined()
      expect(readMessage.data).toEqual(writeMessage.data)
    })

    it('success is logged', async () => {
      expect(log.info).toHaveBeenCalledWith({
        count: 1,
        expectedVersion: undefined,
        position: 0,
        streamName,
        types: ['SomeType']
      }, 'message-store write: successful')
    })
  })

  describe('batch of messages', () => {
    let streamName, writeMessage1, writeMessage2
    beforeEach(async () => {
      setup()
      streamName = exampleStreamName()
      writeMessage1 = exampleWriteMessageData()
      writeMessage2 = exampleWriteMessageData()

      await store.write([writeMessage1, writeMessage2], streamName)
    })

    it('all messages are written', async () => {
      const results = await store.get(streamName)
      expect(results).toHaveLength(2)
    })
  })

  describe('expected version', () => {
    describe('single message', () => {
      it('is forwarded to put when writing', () => {
        const put = jest.fn()
        const streamName = exampleStreamName()
        const writeMessage = exampleWriteMessageData()
        const expectedVersion = 0

        const { write } = createWrite({ db, log, put })
        write(writeMessage, streamName, expectedVersion)

        expect(put).toHaveBeenCalledWith(writeMessage, streamName, expectedVersion)
      })
    })

    describe('batch of messages', () => {
      it('is forwarded to put when writing', async () => {
        const put = jest.fn()
        const streamName = exampleStreamName()
        const writeMessage1 = exampleWriteMessageData()
        const writeMessage2 = exampleWriteMessageData()

        const { write } = createWrite({ db, log, put })
        await write([writeMessage1, writeMessage2], streamName, 0)

        expect(put.mock.calls).toEqual([
          [writeMessage1, streamName, 0],
          [writeMessage2, streamName, 1]
        ])
      })
    })
  })
})
