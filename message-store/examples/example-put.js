const { exampleStreamName, exampleWriteMessageData } = require('../../messaging/examples')

const examplePut = async (store, { streamName, count, trackMessages = false } = {}) => {
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
