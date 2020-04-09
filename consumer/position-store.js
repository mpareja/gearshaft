const { fromReadMessageData, toWriteMessageData } = require('../messaging')
const { getPositionStreamName } = require('./position-stream-name')
const { Recorded } = require('./position-store/recorded')

exports.createPositionStore = ({ messageStore, streamName, consumerId }) => {
  const positionStreamName = getPositionStreamName(streamName, consumerId)

  const get = async () => {
    const messageData = await messageStore.getLast(positionStreamName)

    if (!messageData) {
      return null
    }

    const recorded = fromReadMessageData(messageData, Recorded)

    return recorded.position
  }

  const put = (position) => {
    const recorded = Recorded.create(position)
    const messageData = toWriteMessageData(recorded)
    return messageStore.write(messageData, positionStreamName)
  }

  return { get, put }
}
