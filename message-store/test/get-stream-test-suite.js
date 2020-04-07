const createLog = require('../../test/test-log')
const { AssertionError } = require('assert')
const { exampleCategory, examplePut, exampleStreamName } = require('../examples')

exports.generateGetStreamSuite = ({
  createMessageStore
}) => {
  let messageStore, log
  beforeEach(async () => {
    log = createLog()
    messageStore = createMessageStore({ log })
  })

  describe('get-stream', () => {
    describe('given a category rather than stream name', () => {
      it('throws error', async () => {
        const category = exampleCategory()

        const error = await messageStore.getStream(category).catch(err => err)

        expect(error).toBeInstanceOf(AssertionError)
        expect(error.message).toBe(`stream required, not a category (${category})`)
      })
    })

    describe('stream with no messages', () => {
      let streamName, results

      beforeEach(async () => {
        streamName = exampleStreamName()
        results = await messageStore.getStream(streamName)
      })

      it('returns empty array', async () => {
        expect(results).toEqual([])
      })

      it('logs success', () => {
        expect(log.info).toHaveBeenCalledWith({
          batchSize: expect.any(Number),
          count: 0,
          position: 0,
          streamName: streamName
        }, 'message-store get: successful')
      })
    })

    describe('stream with multiple streams', () => {
      it('retrieves all messages from stream', async () => {
        const { streamName, messages } = await examplePut(messageStore, { count: 3, trackMessages: true })

        const results = await messageStore.getStream(streamName)

        expect(results.map(r => r.id)).toEqual(messages.map(m => m.id))
      })
    })

    describe('batch size', () => {
      describe('when not specified', () => {
        it('uses default value of 1000', async () => {
          await messageStore.getStream(exampleStreamName())

          expect(log.info).toHaveBeenCalledWith(expect.objectContaining({
            batchSize: 1000
          }), expect.anything())
        })
      })

      describe('store with an overriden batch size', () => {
        it('limits the results to the batch size', async () => {
          const A_BATCH_SIZE = 2
          messageStore = createMessageStore({ log, batchSize: A_BATCH_SIZE })
          const { streamName } = await examplePut(messageStore, { count: 3 })

          const results = await messageStore.getStream(streamName)

          expect(results.length).toBe(A_BATCH_SIZE)
          expect(log.info).toHaveBeenCalledWith(expect.objectContaining({
            batchSize: A_BATCH_SIZE
          }), expect.anything())
        })
      })

      describe('individual getStream request with overriden batch size', () => {
        it('limits the results to the specified batch size', async () => {
          const A_BATCH_SIZE = 2
          const { streamName } = await examplePut(messageStore, { count: A_BATCH_SIZE + 1 })

          const results = await messageStore.getStream(streamName, {
            batchSize: A_BATCH_SIZE
          })

          expect(results.length).toBe(A_BATCH_SIZE)
          expect(log.info).toHaveBeenCalledWith(expect.objectContaining({
            batchSize: A_BATCH_SIZE
          }), expect.anything())
        })
      })
    })

    describe('when called without await', () => {
      it('does not operate during the same tick of the event loop', () => {
        const streamName = exampleStreamName()

        messageStore.getStream(streamName)

        expect(log.info).not.toHaveBeenCalled()
      })
    })
  })
}
