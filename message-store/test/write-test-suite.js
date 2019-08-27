const createLog = require('../../test/test-log')
const {
  exampleStreamName, exampleWriteMessageData
} = require('../examples')

exports.generateWriteSuite = ({
  createMessageStore
}) => {
  let store, log
  const setup = async () => {
    log = createLog()
    store = createMessageStore({ log })
  }

  describe('write', () => {
    describe('single message', () => {
      let position, streamName, writeMessage
      beforeAll(async () => {
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

      it('position is returned', () => {
        expect(position).toBe(0)
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

    describe('transaction', () => {
      describe('error after some messages in batch have been written', () => {
        it('no new messages are written (rollback)', async () => {
          setup()
          const streamName = exampleStreamName()
          const writeMessage1 = exampleWriteMessageData()
          const badMessage = { id: 'bad uuid', type: writeMessage1.type }
          const writeMessage3 = exampleWriteMessageData()

          const promise = store.write([writeMessage1, badMessage, writeMessage3], streamName)
          await expect(promise).rejects.toThrow(/error writing to database.*bad uuid/)

          const results = await store.get(streamName)
          expect(results).toHaveLength(0)
        })

        it('preserves previously written messages', async () => {
          setup()
          const streamName = exampleStreamName()
          const writeMessageBefore = exampleWriteMessageData()
          await store.write([writeMessageBefore], streamName)

          const writeMessage1 = exampleWriteMessageData()
          const badMessage = { id: 'bad uuid', type: writeMessage1.type }
          const writeMessage3 = exampleWriteMessageData()

          const promise = store.write([writeMessage1, badMessage, writeMessage3], streamName)
          await expect(promise).rejects.toThrow(/error writing to database.*bad uuid/)

          const results = await store.get(streamName)
          expect(results).toHaveLength(1)
        })
      })
    })

    describe('expected version', () => {
      describe('writing multiple messages in same category', () => {
        it('messages are written with the expected versions', async () => {
          const streamName = exampleStreamName()

          const wm0 = exampleWriteMessageData()
          await store.write(wm0, streamName)

          const wm1 = exampleWriteMessageData()
          await store.write(wm1, streamName, 0)

          const readMessage = (await store.get(streamName, 1))[0]

          expect(readMessage.data).toEqual(wm1.data)
        })
      })

      describe('writing messages in different categories without ids', () => {
        it('messages are written with expected versions', async () => {
          const streamName0 = exampleStreamName(null, 'none')
          const wm0 = exampleWriteMessageData()
          await store.write(wm0, streamName0)

          const streamName1 = exampleStreamName(null, 'none')
          const wm1 = exampleWriteMessageData()
          await store.write(wm1, streamName1)

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
          const oldPosition = await store.write(exampleWriteMessageData(), streamName)
          await store.write(exampleWriteMessageData(), streamName)

          try {
            await store.write(exampleWriteMessageData(), streamName, oldPosition)
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
  })
}
