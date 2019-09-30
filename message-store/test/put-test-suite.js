const createLog = require('../../test/test-log')
const uuidValidate = require('uuid-validate')
const {
  examplePut, exampleStreamName, exampleWriteMessageData
} = require('../examples')

exports.generatePutSuite = ({
  createMessageStore
}) => {
  let store, log
  const setup = async () => {
    log = createLog()
    store = createMessageStore({ log })
    return { log, store }
  }

  beforeEach(setup)

  describe('put', () => {
    describe('single message', () => {
      it('returns position as first message in stream', async () => {
        const { store } = await setup()
        const { position } = await examplePut(store)
        expect(position).toBe(0)
      })

      it('logs success', async () => {
        const { log, store } = await setup()
        const { messages: [message], streamName } = await examplePut(store)

        expect(log.info).toHaveBeenCalledWith({
          expectedVersion: undefined,
          id: message.id,
          position: 0,
          streamName: streamName,
          type: 'SomeType'
        }, 'message-store put: successful')
      })

      it('can be retrieved', async () => {
        const { store } = await setup()
        const { messages: [message], streamName } = await examplePut(store)

        const results = await store.get(streamName)

        expect(results).toHaveLength(1)
        expect(results[0]).toEqual({
          id: message.id,
          type: message.type,
          data: message.data,
          metadata: message.metadata,
          streamName,
          position: 0,
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
        const performStaleWrite = async () => {
          const { position: oldPosition, streamName } = await examplePut(store)
          await examplePut(store, { streamName })

          let error
          try {
            await store.put(exampleWriteMessageData(), streamName, oldPosition)
          } catch (e) {
            error = e
          }

          return { error, store, streamName }
        }

        it('results in an error', async () => {
          const { error, store, streamName } = await performStaleWrite()

          const expectedMessage = `message-store put: Wrong expected version: 0 (Stream: ${streamName}, Stream Version: 1)`
          expect(error).toEqual(new Error(expectedMessage))
          expect(store.isExpectedVersionError(error)).toBe(true)
        })

        it('does not write new message', async () => {
          const { store, streamName } = await performStaleWrite()

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
  })

  describe('example-put', () => {
    describe('when trackMessages is false', () => {
      it('does not track messages', async () => {
        const { messages } = await examplePut(store, { trackMessages: false })
        expect(messages).toHaveLength(0)
      })
    })
  })
}
