const { exampleStreamName } = require('./example-stream-name')
const { exampleWriteMessageData } = require('./example-message-data')

const examplePut = async (store, { streamName, count } = {}) => {
  count = count || 1
  streamName = streamName || exampleStreamName()

  let position
  while (count--) {
    const message = exampleWriteMessageData()
    position = await store.put(message, streamName)
  }
  return { streamName, position }
}

module.exports = { examplePut }
