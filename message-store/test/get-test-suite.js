const createLog = require('../../test/test-log')
const { examplePut, exampleStreamName } = require('../examples')

exports.generateGetSuite = ({
  createMessageStore
}) => {
  describe('get', () => {
    let store, log
    beforeEach(async () => {
      log = createLog()
      store = createMessageStore({ log })
    })

    describe('stream with no messages', () => {
      let streamName, results

      beforeEach(async () => {
        streamName = exampleStreamName()
        results = await store.get(streamName)
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

    describe('batch size', () => {
      describe('when not specified', () => {
        it('uses default value of 1000', async () => {
          await store.get(exampleStreamName())

          expect(log.info).toHaveBeenCalledWith(expect.objectContaining({
            batchSize: 1000
          }), expect.anything())
        })
      })

      describe('store with an overriden batch size', () => {
        const A_BATCH_SIZE = 2
        beforeEach(() => {
          store = createMessageStore({ log, batchSize: A_BATCH_SIZE })
        })

        it('limits the results to the batch size', async () => {
          const { streamName } = await examplePut(store, { count: 3 })
          const results = await store.get(streamName)
          expect(results.length).toBe(A_BATCH_SIZE)
        })
      })

      describe('get with batch size specified', () => {
        it('limits the results to the batch size', async () => {
          const A_BATCH_SIZE = 2
          const { streamName } = await examplePut(store, { count: 4 })
          const results = await store.get(streamName, A_BATCH_SIZE)
          expect(results.length).toBe(A_BATCH_SIZE)
        })
      })
    })
  })
}
