const createRead = require('../read')
const { asyncIterableToArray } = require('../../test/async-iterable-to-array')
const { exampleReadMessageData, exampleStreamName } = require('../examples')

describe('read', () => {
  describe('given messages in stream', () => {
    it('yields results', async () => {
      const streamName = exampleStreamName()
      const expected = [
        exampleReadMessageData(),
        exampleReadMessageData()
      ]

      const get = jest.fn().mockResolvedValue(expected)
      const { read } = createRead({ batchSize: 10, get })
      const results = await asyncIterableToArray(read(streamName)) // process all records

      expect(results).toEqual(expected)
    })
  })

  describe('batchSize', () => {
    describe('no batch size specified', () => {
      it('uses global default of 1000', async () => {
        const streamName = exampleStreamName()
        const get = jest.fn().mockResolvedValue([])

        const { read } = createRead({ get })
        await asyncIterableToArray(read(streamName)) // process all records

        expect(get).toHaveBeenCalledWith(streamName, expect.objectContaining({
          batchSize: 1000
        }))
      })
    })

    describe('global batchSize specified', () => {
      it('uses specified global batchSize', async () => {
        const streamName = exampleStreamName()
        const get = jest.fn().mockResolvedValue([])

        const { read } = createRead({ batchSize: 2, get })
        await asyncIterableToArray(read(streamName)) // process all records

        expect(get).toHaveBeenCalledWith(streamName, expect.objectContaining({
          batchSize: 2
        }))
      })
    })

    describe('batchSize specified for a particular request', () => {
      it('uses specified request batchSize', async () => {
        const streamName = exampleStreamName()
        const get = jest.fn().mockResolvedValue([])

        const { read } = createRead({ batchSize: 2, get })
        await asyncIterableToArray(read(streamName, { batchSize: 10 })) // process all records

        expect(get).toHaveBeenCalledWith(streamName, expect.objectContaining({
          batchSize: 10
        }))
      })
    })

    describe('BUG: partial results because request batch size not used when deciding to continue', () => {
      it('uses specified request batchSize', async () => {
        const streamName = exampleStreamName()
        const get = jest.fn()
          .mockResolvedValueOnce([exampleReadMessageData(), exampleReadMessageData()])
          .mockResolvedValueOnce([exampleReadMessageData(), exampleReadMessageData()])
          .mockResolvedValueOnce([])

        const { read } = createRead({ batchSize: 4, get })
        const results = await asyncIterableToArray(read(streamName, { batchSize: 2 })) // process all records

        expect(results).toHaveLength(4)
      })
    })
  })

  describe('given a custom option', () => {
    it('custom option is forwarded to get implementation', async () => {
      const streamName = exampleStreamName()
      const customOption = 'customValue'
      const get = jest.fn().mockResolvedValue([])

      const { read } = createRead({ batchSize: 10, get })
      await asyncIterableToArray(read(streamName, { customOption })) // process all records

      expect(get).toHaveBeenCalledWith(streamName, expect.objectContaining({
        customOption
      }))
    })
  })
})
