const { exampleStreamName } = require('./example-stream-name')
const { exampleWriteMessageData } = require('./example-message-data')

const examplePut = async (store, { count } = {}) => {
  count = count || 1
  const streamName = exampleStreamName()

  let position
  while (count--) {
    const message = exampleWriteMessageData()
    position = await store.put(message, streamName)
  }
  return { streamName, position }
}

module.exports = { examplePut }
