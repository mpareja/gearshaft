const { getPositionStreamName } = require('../position-stream-name')
const { StreamName } = require('../../messaging')
const {
  exampleConsumerId,
  exampleStreamName
} = require('../examples')

describe('position-stream-name', () => {
  describe('given a stream without an id', () => {
    const streamName = exampleStreamName(null, 'none')
    const consumerId = exampleConsumerId()
    const positionStreamName = getPositionStreamName(streamName, consumerId)

    it('stream id becomes consumer id', () => {
      expect(StreamName.getId(positionStreamName)).toEqual(consumerId)
    })

    it('entity remains the same', () => {
      expect(StreamName.getEntityName(positionStreamName)).toEqual(StreamName.getEntityName(streamName))
    })

    it('adds the posiiton type', () => {
      const types = StreamName.getTypes(positionStreamName)
      expect(types).toContain('position')
    })
  })

  describe('given a stream with an id', () => {
    const streamName = exampleStreamName(null, 'SomeStreamId')
    const consumerId = 'SomeConsumerId'
    const positionStreamName = getPositionStreamName(streamName, consumerId)

    it('appends the consumer id to the stream id with an underscore', () => {
      expect(StreamName.getId(positionStreamName)).toEqual('SomeStreamId_SomeConsumerId')
    })
  })

  describe('given no consumer id', () => {
    const streamName = exampleStreamName()
    const positionStreamName = getPositionStreamName(streamName)

    it('id remains unchanged', () => {
      expect(StreamName.getId(positionStreamName)).toEqual(StreamName.getId(streamName))
    })
  })

  describe('types', () => {
    describe('given stream name with existing types', () => {
      const streamName = exampleStreamName(null, { types: ['bob'] })
      const consumerId = exampleConsumerId()

      const positionStreamName = getPositionStreamName(streamName, consumerId)

      it('preserves the existing types', () => {
        const types = StreamName.getTypes(positionStreamName)
        expect(types).toContain('bob')
      })

      it('adds the position type', () => {
        const types = StreamName.getTypes(positionStreamName)
        expect(types).toContain('position')
      })
    })

    describe('given a stream name already containing position type', () => {
      const streamName = exampleStreamName(null, { types: ['position'] })
      const consumerId = exampleConsumerId()

      const positionStreamName = getPositionStreamName(streamName, consumerId)

      it('position type is only listed once', () => {
        const types = StreamName.getTypes(positionStreamName)
        expect(types.filter(t => t === 'position').length).toEqual(1)
      })
    })
  })
})
