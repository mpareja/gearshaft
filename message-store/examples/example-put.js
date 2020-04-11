const { exampleStreamName } = require('./example-stream-name')
const { exampleCategory } = require('./example-category')
const { exampleWriteMessageData } = require('./example-message-data')

exports.examplePut = async (messageStore, { category, streamName, count, trackMessages = true } = {}) => {
  count = count || 1
  streamName = streamName || exampleStreamName(category)

  const messages = []
  let position
  while (count--) {
    const message = exampleWriteMessageData()
    if (trackMessages) {
      messages.push(message)
    }
    position = await messageStore.put(message, streamName)
  }
  return { streamName, position, messages }
}

exports.examplePutCategory = async (messageStore, { category, count, trackMessages = true } = {}) => {
  count = count || 1
  category = exampleCategory()

  const messages = []
  let position
  while (count--) {
    const streamName = exampleStreamName(category)
    const message = exampleWriteMessageData()
    if (trackMessages) {
      messages.push(message)
    }
    position = await messageStore.put(message, streamName)
  }
  return { category, position, messages }
}
