const createLog = require('../../test/test-log')
const uuidValidate = require('uuid-validate')
const { exampleStreamName, exampleWriteMessageData, StreamName } = require('../../messaging')
const { ExpectedVersionError } = require('../expected-version-error')

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
        expect(readMessage).toEqual({
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
        expect(results.map(m => m.data)).toEqual([writeMessage1.data, writeMessage2.data])
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

          const streamResults = await store.get(streamName)
          expect(streamResults).toHaveLength(0)

          const categoryResults = await store.get(StreamName.getCategory(streamName))
          expect(categoryResults).toHaveLength(0)
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

    describe('message without id', () => {
      it('generates id', async () => {
        const streamName = exampleStreamName()
        const writeMessage = exampleWriteMessageData()
        delete writeMessage.id

        await store.write(writeMessage, streamName)

        const readMessage = (await store.get(streamName))[0]
        expect(uuidValidate(readMessage.id)).toBe(true)
      })
    })

    describe('expected version', () => {
      describe('writing message specifying previous message version', () => {
        it('message is written with the expected version', async () => {
          const streamName = exampleStreamName()

          const wm0 = exampleWriteMessageData()
          const position1 = await store.write(wm0, streamName)

          const wm1 = exampleWriteMessageData()
          const position2 = await store.write(wm1, streamName, position1)

          const readMessage = await store.getLast(streamName)

          expect(readMessage.data).toEqual(wm1.data)
          expect(readMessage.metadata.position).toEqual(position2)
          expect(readMessage.metadata.position).toEqual(1)
        })
      })

      describe('writing message specifying stale version', () => {
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
          expect(error).toBeInstanceOf(ExpectedVersionError)
        })

        it('does not write new message', async () => {
          const results = await store.get(streamName)
          expect(results.length).toBe(2)
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
          expect(error).toBeInstanceOf(ExpectedVersionError)
        })
      })
    })
  })
}
