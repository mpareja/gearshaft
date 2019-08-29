const { fromReadMessageData, toWriteMessageData } = require('../messaging')
const { getPositionStreamName } = require('./position-stream-name')
const { PositionRecorded } = require('./position-recorded')

exports.createPositionStore = ({ store, streamName, consumerId }) => {
  const positionStreamName = getPositionStreamName(streamName, consumerId)

  const get = async () => {
    const messageData = await store.getLast(positionStreamName)

    if (!messageData) {
      return null
    }

    const recorded = fromReadMessageData(messageData, PositionRecorded)

    return recorded.position
  }

  const put = (position) => {
    const recorded = PositionRecorded.create(position)
    const messageData = toWriteMessageData(recorded)
    return store.write(messageData, positionStreamName)
  }

  return { get, put }
}
