const { exampleStreamName } = require('./example-stream-name')
const { exampleWriteMessageData } = require('./example-message-data')

const examplePut = async (store, { streamName, count, trackMessages = true } = {}) => {
  count = count || 1
  streamName = streamName || exampleStreamName()

  const messages = []
  let position
  while (count--) {
    const message = exampleWriteMessageData()
    if (trackMessages) {
      messages.push(message)
    }
    position = await store.put(message, streamName)
  }
  return { streamName, position, messages }
}

module.exports = { examplePut }
