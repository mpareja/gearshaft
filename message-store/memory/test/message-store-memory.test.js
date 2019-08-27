const createLog = require('../../../test/test-log')
const createMessageStore = require('../index')
const uuidValidate = require('uuid-validate')
const { generateGetLastSuite } = require('../../test/get-last-test-suite')
const { generateReadSuite } = require('../../test/read-test-suite')
const { generateWriteSuite } = require('../../test/write-test-suite')
const {
  exampleMessageData,
  exampleStreamName
} = require('../../examples')

describe('message-store-memory', () => {
  generateGetLastSuite({ createMessageStore })
  generateReadSuite({ createMessageStore })
  generateWriteSuite({ createMessageStore })

  let store, log
  beforeEach(() => {
    log = createLog()
    store = createMessageStore({ log })
  })

  const read = (...args) => {
    return readFrom(store, ...args)
  }

  const readFrom = async (aStore, streamName, position) => {
    const found = []
    for await (const message of aStore.read(streamName, position)) {
      found.push(message)
    }
    return found
  }

  describe('reading stream that does not exist', () => {
    it('returns no messages', async () => {
      const found = await read('stream-123')

      expect(found).toHaveLength(0)
    })
  })

  describe('write message to stream', () => {
    let position, streamName, writeMessage
    beforeEach(async () => {
      writeMessage = exampleMessageData()
      streamName = exampleStreamName()
      position = await store.write(writeMessage, streamName)
    })

    it('can be retrieved', async () => {
      const found = await read(streamName)
      expect(found).toHaveLength(1)
      expect(found[0]).toEqual({
        id: writeMessage.id,
        type: writeMessage.type,
        data: writeMessage.data,
        metadata: writeMessage.metadata,
        streamName,
        position: 0,
        globalPosition: expect.any(Number),
        time: expect.any(Date)
      })
    })

    it('returns the position', () => {
      expect(position).toBe(0)
    })
  })

  describe('stream without id', () => {
    it('writes the category as the stream name', async () => {
      const streamName = exampleStreamName(null, 'none')
      await store.write(exampleMessageData(), streamName)

      const found = await read(streamName)

      expect(found[0].streamName).toBe(streamName)
    })
  })

  describe('message without id', () => {
    it('generates id', async () => {
      const streamName = exampleStreamName()
      const writeMessage = exampleMessageData()
      delete writeMessage.id
      await store.write(writeMessage, streamName)

      const readMessage = (await read(streamName))[0]

      expect(uuidValidate(readMessage.id)).toBe(true)
    })
  })

  describe('write seperate messages to stream', () => {
    let message1, message2
    beforeEach(async () => {
      message1 = exampleMessageData()
      message2 = exampleMessageData()
      await store.write(message1, 'stream-123')
      await store.write(message2, 'stream-123')
    })

    describe('reading messages from stream', () => {
      it('returns expected messages', async () => {
        const found = await read('stream-123')

        expect(found.map(m => m.data)).toEqual([message1.data, message2.data])
      })
    })

    describe('reading messages from stream position', () => {
      it('returns expected subset of messages', async () => {
        const found = await read('stream-123', 1)

        expect(found.map(m => m.data)).toEqual([message2.data])
      })
    })

    describe('reading messages from other stream', () => {
      it('returns no messages', async () => {
        const found = await read('stream-666')

        expect(found).toHaveLength(0)
      })
    })
  })

  describe('write batch of messages to stream', () => {
    let message1, message2
    beforeEach(async () => {
      message1 = exampleMessageData()
      message2 = exampleMessageData()
      await store.write([message1, message2], 'stream-123')
    })

    describe('reading messages from stream', () => {
      it('returns expected messages', async () => {
        const found = await read('stream-123')

        expect(found.map(m => m.data)).toEqual([message1.data, message2.data])
      })
    })
  })

  describe('positions', () => {
    describe('within a stream', () => {
      let found
      beforeEach(async () => {
        const streamName = exampleStreamName()
        await store.write([exampleMessageData(), exampleMessageData()], streamName)

        found = await read(streamName)
      })

      it('position increases', () => {
        expect(found.map(m => m.position)).toEqual([0, 1])
      })

      it('globalPosition increases', () => {
        expect(found.map(m => m.globalPosition)).toEqual([0, 1])
      })
    })

    describe('across streams', () => {
      let found
      beforeEach(async () => {
        const streamName1 = exampleStreamName()
        await store.write([exampleMessageData(), exampleMessageData()],
          streamName1)

        const streamName2 = exampleStreamName()
        await store.write([exampleMessageData(), exampleMessageData()],
          streamName2)

        found = await read(streamName2)
      })

      it('position resets', () => {
        expect(found.map(m => m.position)).toEqual([0, 1])
      })

      it('globalPosition increases', () => {
        expect(found.map(m => m.globalPosition)).toEqual([2, 3])
      })
    })
  })

  describe('duplicate message id', () => {
    it('is an error', async () => {
      const streamName = exampleStreamName()
      const message = exampleMessageData()
      await store.write(message, streamName)

      await expect(store.write(message, streamName)).rejects.toEqual(new Error(
        `message-store write: duplicate message id: ${message.id}`))
    })
  })

  describe('expected version', () => {
    describe('writing multiple messages in same category', () => {
      it('messages are written with the expected versions', async () => {
        const streamName = exampleStreamName()

        const wm0 = exampleMessageData()
        await store.write(wm0, streamName)

        const wm1 = exampleMessageData()
        await store.write(wm1, streamName)

        const readMessage = (await read(streamName, 1))[0]

        expect(readMessage.data).toEqual(wm1.data)
      })
    })

    describe('writing message with stale version', () => {
      let streamName, error, sharedStore
      beforeAll(async () => {
        streamName = exampleStreamName()
        sharedStore = createMessageStore({ log })
        const oldPosition = await sharedStore.write(exampleMessageData(), streamName)
        await sharedStore.write(exampleMessageData(), streamName)

        try {
          await sharedStore.write(exampleMessageData(), streamName, oldPosition)
        } catch (e) {
          error = e
        }
      })

      it('results in an error', async () => {
        const expectedMessage = `message-store put: Wrong expected version: 0 (Stream: ${streamName}, Stream Version: 1)`
        expect(error).toEqual(new Error(expectedMessage))
      })

      it('does not write new message', async () => {
        const results = await readFrom(sharedStore, streamName)
        expect(results.length).toBe(2)
      })
    })
  })
})
