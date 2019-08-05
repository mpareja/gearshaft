const operationError = require('../errors/operation-error')
const { toWriteMessageData } = require('./message-transforms')

const writeError = operationError('messaging write')

module.exports = ({ log, store }) => {
  const write = async (messageOrBatch, streamName, { expectedVersion } = {}) => {
    const info = {
      count: Array.isArray(messageOrBatch) ? messageOrBatch.length : 1,
      expectedVersion,
      streamName
    }
    log.debug(info, 'messaging write: starting')

    const messages = Array.isArray(messageOrBatch) ? messageOrBatch : [messageOrBatch]
    const data = transformMessages(messages)

    const position = store.write(data, streamName, expectedVersion)

    log.info({
      ...info,
      types: data.map(d => d.type)
    }, 'messaging write: successful')

    return position
  }

  write.initial = (messageOrBatch, streamName) => {
    return write(messageOrBatch, streamName, { expectedVersion: -1 })
  }

  return write
}

const transformMessages = (messages) => {
  try {
    return messages.map(toWriteMessageData)
  } catch (err) {
    throw writeError('one or more messages were invalid', err)
  }
}
