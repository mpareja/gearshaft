const { createPositionStore } = require('../position-store')
const { exampleMessageStore, exampleStreamName } = require('../../message-store/examples')

exports.examplePositionStore = ({ store, streamName, ...args } = {}) => {
  streamName = streamName || exampleStreamName()
  store = store || exampleMessageStore()
  return createPositionStore({ ...args, store, streamName })
}
