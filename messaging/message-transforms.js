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
