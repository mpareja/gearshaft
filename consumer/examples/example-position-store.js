const { createPositionStore } = require('../position-store')
const { exampleMessageStore, exampleStreamName } = require('../../message-store')

exports.examplePositionStore = ({ messageStore, streamName, ...args } = {}) => {
  streamName = streamName || exampleStreamName()
  messageStore = messageStore || exampleMessageStore()
  return createPositionStore({ ...args, messageStore, streamName })
}
