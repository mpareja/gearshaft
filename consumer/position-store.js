const { fromReadMessageData, toWriteMessageData } = require('../messaging')
const { getPositionStreamName } = require('./position-stream-name')
const { PositionRecorded } = require('./position-recorded')

exports.createPositionStore = ({ messageStore, streamName, consumerId }) => {
  const positionStreamName = getPositionStreamName(streamName, consumerId)

  const get = async () => {
    const messageData = await messageStore.getLast(positionStreamName)

    if (!messageData) {
      return null
    }

    const recorded = fromReadMessageData(messageData, PositionRecorded)

    return recorded.position
  }

  const put = (position) => {
    const recorded = PositionRecorded.create(position)
    const messageData = toWriteMessageData(recorded)
    return messageStore.write(messageData, positionStreamName)
  }

  return { get, put }
}
