const createLog = require('../../test/test-log')
const uuidValidate = require('uuid-validate')
const { ExpectedVersionError } = require('../expected-version-error')
const {
  examplePut, examplePutCategory, exampleStreamName, exampleWriteMessageData
} = require('../examples')

exports.generatePutSuite = ({
  createMessageStore
}) => {
  let messageStore, log
  const setup = async () => {
    log = createLog()
    messageStore = createMessageStore({ log })
    return { log, messageStore }
  }

  beforeEach(setup)

  describe('put', () => {
    describe('single message', () => {
      it('returns position as first message in stream', async () => {
        const { messageStore } = await setup()
        const { position } = await examplePut(messageStore)
        expect(position).toBe(0)
      })

      it('logs success', async () => {
        const { log, messageStore } = await setup()
        const { messages: [message], streamName } = await examplePut(messageStore)

        expect(log.info).toHaveBeenCalledWith({
          expectedVersion: undefined,
          id: message.id,
          position: 0,
          streamName: streamName,
          type: 'SomeType'
        }, 'message-store put: successful')
      })

      it('can be retrieved', async () => {
        const { messageStore } = await setup()
        const { messages: [message], streamName } = await examplePut(messageStore)

        const results = await messageStore.get(streamName)

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

        const position = await messageStore.put(writeMessage, streamName)

        const results = await messageStore.get(streamName, { position })
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

        const position = await messageStore.put(writeMessage, streamName)

        const results = await messageStore.get(streamName, { position })
        const readMessage = results[0]

        expect(readMessage.metadata).toBeNull()
        expect(readMessage.data).toEqual(writeMessage.data)
      })
    })

    describe('stream without id', () => {
      it('writes the category as the stream name', async () => {
        const streamName = exampleStreamName(null, 'none')
        await messageStore.put(exampleWriteMessageData(), streamName)

        const readMessage = (await messageStore.get(streamName))[0]

        expect(readMessage.streamName).toBe(streamName)
      })
    })

    describe('message without id', () => {
      it('generates id', async () => {
        const streamName = exampleStreamName()
        const writeMessage = exampleWriteMessageData()
        delete writeMessage.id
        await messageStore.put(writeMessage, streamName)

        const readMessage = (await messageStore.get(streamName))[0]

        expect(uuidValidate(readMessage.id)).toBe(true)
      })
    })

    describe('expected version', () => {
      describe('writing multiple messages in same stream', () => {
        it('messages are written with the expected versions', async () => {
          const streamName = exampleStreamName()

          const wm0 = exampleWriteMessageData()
          await messageStore.put(wm0, streamName)

          const wm1 = exampleWriteMessageData()
          await messageStore.put(wm1, streamName)

          const readMessage = (await messageStore.get(streamName, { position: 1 }))[0]

          expect(readMessage.data).toEqual(wm1.data)
        })
      })

      describe('writing messages in different categories without ids', () => {
        it('messages are written with expected versions', async () => {
          const streamName0 = exampleStreamName(null, 'none')
          const wm0 = exampleWriteMessageData()
          await messageStore.put(wm0, streamName0)

          const streamName1 = exampleStreamName(null, 'none')
          const wm1 = exampleWriteMessageData()
          await messageStore.put(wm1, streamName1)

          const rm0 = (await messageStore.get(streamName0, { position: 0 }))[0]
          expect(rm0.data).toEqual(wm0.data)

          const rm1 = (await messageStore.get(streamName1, { position: 0 }))[0]
          expect(rm1.data).toEqual(wm1.data)
        })
      })

      describe('writing message with stale version', () => {
        const performStaleWrite = async () => {
          const { position: oldPosition, streamName } = await examplePut(messageStore)
          await examplePut(messageStore, { streamName })

          let error
          try {
            await messageStore.put(exampleWriteMessageData(), streamName, oldPosition)
          } catch (e) {
            error = e
          }

          return { error, messageStore, streamName }
        }

        it('results in an error', async () => {
          const { error, streamName } = await performStaleWrite()

          const expectedMessage = `message-store put: Wrong expected version: 0 (Stream: ${streamName}, Stream Version: 1)`
          expect(error).toEqual(new Error(expectedMessage))
          expect(error).toBeInstanceOf(ExpectedVersionError)
        })

        it('does not write new message', async () => {
          const { messageStore, streamName } = await performStaleWrite()

          const results = await messageStore.get(streamName)
          expect(results.length).toBe(2)
        })
      })

      describe('stream exists and attempting to write message as first', () => {
        it('results in an error', async () => {
          const streamName = exampleStreamName()
          const wm0 = exampleWriteMessageData()
          await messageStore.put(wm0, streamName)

          const wm1 = exampleWriteMessageData()

          let error
          try {
            await messageStore.put(wm1, streamName, -1)
          } catch (e) {
            error = e
          }

          expect(error).toBeDefined()
          expect(error).toBeInstanceOf(ExpectedVersionError)
        })
      })
    })

    describe('when called without await', () => {
      it('does not operate during the same tick of the event loop', () => {
        const streamName = exampleStreamName()
        const message = exampleWriteMessageData()

        messageStore.put(message, streamName)

        expect(log.info).not.toHaveBeenCalled()
      })
    })
  })

  describe('example-put', () => {
    describe('given no options', () => {
      it('tracks the only message written', async () => {
        const { messages } = await examplePut(messageStore)

        expect(messages).toHaveLength(1)
      })
    })

    describe('when trackMessages is false', () => {
      it('does not track messages', async () => {
        const { messages } = await examplePut(messageStore, { trackMessages: false })
        expect(messages).toHaveLength(0)
      })
    })
  })

  describe('example-put-category', () => {
    describe('given no options', () => {
      it('tracks the only target streamName', async () => {
        const { streamNames } = await examplePutCategory(messageStore)

        expect(streamNames).toHaveLength(1)
      })

      it('tracks the only message written', async () => {
        const { messages } = await examplePutCategory(messageStore)

        expect(messages).toHaveLength(1)
      })
    })

    describe('when trackStreamNames is false', () => {
      it('does not track streamNames', async () => {
        const { streamNames } = await examplePutCategory(messageStore, { trackStreamNames: false })
        expect(streamNames).toHaveLength(0)
      })
    })

    describe('when trackMessages is false', () => {
      it('does not track messages', async () => {
        const { messages } = await examplePutCategory(messageStore, { trackMessages: false })
        expect(messages).toHaveLength(0)
      })
    })
  })
}
