const createLog = require('../../test/test-log')
const { AssertionError } = require('assert')
const {
  exampleCategory,
  examplePutCategory,
  exampleStreamName,
  exampleWriteMessageData
} = require('../examples')
const { StreamName } = require('../stream-name')

exports.generateGetCategorySuite = ({
  createMessageStore
}) => {
  let messageStore, log
  beforeEach(async () => {
    log = createLog()
    messageStore = createMessageStore({ log })
  })

  describe('get-category', () => {
    describe('given a stream name rather than category', () => {
      it('throws error', async () => {
        const streamName = exampleStreamName()

        const error = await messageStore.getCategory(streamName).catch(err => err)

        expect(error).toBeInstanceOf(AssertionError)
        expect(error.message).toBe(`stream category required, not a specific stream (${streamName})`)
      })
    })

    describe('category with no messages', () => {
      let category, results

      beforeEach(async () => {
        category = exampleCategory()
        results = await messageStore.getCategory(category)
      })

      it('returns empty array', async () => {
        expect(results).toEqual([])
      })

      it('logs success', () => {
        expect(log.info).toHaveBeenCalledWith({
          batchSize: expect.any(Number),
          count: 0,
          position: 0,
          streamName: category
        }, 'message-store get: successful')
      })
    })

    describe('category with multiple streams', () => {
      it('retrieves messages from all stream', async () => {
        const { category, messages } = await examplePutCategory(messageStore, { count: 3, trackMessages: true })

        const results = await messageStore.getCategory(category)

        expect(results.map(r => r.id)).toEqual(messages.map(m => m.id))
      })
    })

    describe('batch size', () => {
      describe('when not specified', () => {
        it('uses default value of 1000', async () => {
          await messageStore.getCategory(exampleCategory())

          expect(log.info).toHaveBeenCalledWith(expect.objectContaining({
            batchSize: 1000
          }), expect.anything())
        })
      })

      describe('store with an overriden batch size', () => {
        it('limits the results to the batch size', async () => {
          const A_BATCH_SIZE = 2
          messageStore = createMessageStore({ log, batchSize: A_BATCH_SIZE })
          const { category } = await examplePutCategory(messageStore, { count: A_BATCH_SIZE + 1 })

          const results = await messageStore.getCategory(category)

          expect(results.length).toBe(A_BATCH_SIZE)
          expect(log.info).toHaveBeenCalledWith(expect.objectContaining({
            batchSize: A_BATCH_SIZE
          }), expect.anything())
        })
      })

      describe('individual getCategory request with overriden batch size', () => {
        it('limits the results to the specified batch size', async () => {
          const A_BATCH_SIZE = 2
          const { category } = await examplePutCategory(messageStore, { count: A_BATCH_SIZE + 1 })

          const results = await messageStore.getCategory(category, {
            batchSize: A_BATCH_SIZE
          })

          expect(results.length).toBe(A_BATCH_SIZE)
          expect(log.info).toHaveBeenCalledWith(expect.objectContaining({
            batchSize: A_BATCH_SIZE
          }), expect.anything())
        })
      })
    })

    describe('correlation', () => {
      describe('given message with the desired correlation stream name', () => {
        it('returns the correlated message', async () => {
          const correlationCategory = exampleCategory()
          const correlationStreamName = exampleStreamName(correlationCategory)

          const emittingCategory = exampleCategory()
          const emittingStreamName = exampleStreamName(emittingCategory)

          const publishedMessageData = exampleWriteMessageData()
          publishedMessageData.metadata.correlationStreamName = correlationStreamName

          await messageStore.put(publishedMessageData, emittingStreamName)

          const results = await messageStore.getCategory(emittingCategory, {
            correlation: correlationCategory
          })

          expect(results).toHaveLength(1)
          expect(results.map(r => r.id)).toEqual([publishedMessageData.id])
        })
      })

      describe('given message does not match correlation stream name', () => {
        it('does not return message', async () => {
          const correlationCategory = exampleCategory()

          const emittingCategory = exampleCategory()
          const emittingStreamName = exampleStreamName(emittingCategory)

          const publishedMessageData = exampleWriteMessageData()
          publishedMessageData.metadata.correlationStreamName = exampleStreamName()

          await messageStore.put(publishedMessageData, emittingStreamName)

          const results = await messageStore.getCategory(emittingCategory, {
            correlation: correlationCategory
          })

          expect(results).toHaveLength(0)
        })
      })

      describe('given message without correlation stream name', () => {
        it('does not return message', async () => {
          const correlationCategory = exampleCategory()

          const emittingCategory = exampleCategory()
          const emittingStreamName = exampleStreamName(emittingCategory)

          const publishedMessageData = exampleWriteMessageData()
          publishedMessageData.metadata.correlationStreamName = undefined

          await messageStore.put(publishedMessageData, emittingStreamName)

          const results = await messageStore.getCategory(emittingCategory, {
            correlation: correlationCategory
          })

          expect(results).toHaveLength(0)
        })
      })
    })

    describe('consumer group', () => {
      const setupTwoMemberStreams = async () => {
        const category = exampleCategory()

        // 'A' and 'C' were chosen because consistent hashing
        // makes them different members for a group of size 2
        const streamNameA = StreamName.create(category, 'A')
        const streamNameC = StreamName.create(category, 'C')

        const firstA = exampleWriteMessageData()
        const secondA = exampleWriteMessageData()
        const firstC = exampleWriteMessageData()
        const secondC = exampleWriteMessageData()

        // interleave to ensure awaiting 2 doesn't accidentally pick
        // the correct subset of messages
        await messageStore.put(firstA, streamNameA)
        await messageStore.put(firstC, streamNameC)
        await messageStore.put(secondA, streamNameA)
        await messageStore.put(secondC, streamNameC)

        return {
          category,
          messageStore,

          streamNameA,
          firstA,
          secondA,

          streamNameC,
          firstC,
          secondC
        }
      }

      it('returns messages from first member', async () => {
        const { category, firstA, secondA } = await setupTwoMemberStreams()

        const results = await messageStore.getCategory(category, {
          consumerGroupMember: 0,
          consumerGroupSize: 2
        })

        expect(results.map(r => r.id)).toEqual([firstA.id, secondA.id])
      })

      it('returns messages from second member', async () => {
        const { category, firstC, secondC } = await setupTwoMemberStreams()

        const results = await messageStore.getCategory(category, {
          consumerGroupMember: 1,
          consumerGroupSize: 2
        })

        expect(results.map(r => r.id)).toEqual([firstC.id, secondC.id])
      })

      // support configuration via environment vars
      it('handles _string_ group member and size', async () => {
        const { category, firstA, secondA } = await setupTwoMemberStreams()

        const results = await messageStore.getCategory(category, {
          consumerGroupMember: '0',
          consumerGroupSize: '2'
        })

        expect(results.map(r => r.id)).toEqual([firstA.id, secondA.id])
      })
    })

    describe('when called without await', () => {
      it('does not operate during the same tick of the event loop', () => {
        const category = exampleCategory()

        messageStore.getCategory(category)

        expect(log.info).not.toHaveBeenCalled()
      })
    })
  })
}
