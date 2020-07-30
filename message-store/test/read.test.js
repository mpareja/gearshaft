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

  describe('given a custom option', () => {
    it('custom option is forwarded to get implementation', async () => {
      const streamName = exampleStreamName()
      const customOption = 'customValue'
      const get = jest.fn().mockResolvedValue([])

      const { read } = createRead({ batchSize: 10, get })
      await asyncIterableToArray(read(streamName, { customOption })) // process all records

      expect(get).toHaveBeenCalledWith(streamName, { customOption })
    })
  })
})
