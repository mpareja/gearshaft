const assert = require('assert')
const deleteKeysWithNullValues = (obj) => {
  for (const [key, val] of Object.entries(obj)) {
    if (val === null) {
      delete obj[key]
    }
  }
}

module.exports.toWriteMessageData = (message) => {
  assert(message, 'toWriteMessageData: message must be defined')

  const { id, metadata: messageMetadata, ...data } = message
  const { ...metadata } = messageMetadata || {}

  deleteKeysWithNullValues(metadata)

  const messageData = {
    id,
    data,
    metadata,
    type: message.constructor.name
  }
  return messageData
}

module.exports.fromReadMessageData = (messageData, Class) => {
  assert(messageData, 'fromReadMessageData: messageData must be defined')

  const message = new Class()
  Object.assign(message, messageData.data)
  message.id = messageData.id
  message.metadata = messageData.metadata || {}

  message.streamName = messageData.streamName
  message.position = messageData.position
  message.globalPosition = messageData.globalPosition
  message.time = messageData.time

  return message
}
