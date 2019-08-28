const assert = require('assert')
const cloneDeep = require('lodash.clonedeep')

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

  const metadata = messageData.metadata ? cloneDeep(messageData.metadata) : {}
  message.metadata = metadata

  metadata.streamName = messageData.streamName
  metadata.position = messageData.position
  metadata.globalPosition = messageData.globalPosition
  metadata.time = messageData.time

  return message
}
