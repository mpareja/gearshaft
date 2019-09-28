const operationError = require('../errors/operation-error')
const { createNullLog } = require('./null')
const { EventEmitter } = require('events')
const { toWriteMessageData } = require('./message-transforms')

const writeError = operationError('messaging write')

exports.createWriter = ({ log = createNullLog(), store }) => {
  const emitter = new EventEmitter()

  const write = async (messageOrBatch, streamName, { expectedVersion } = {}) => {
    const start = process.hrtime.bigint()
    const messages = Array.isArray(messageOrBatch) ? messageOrBatch : [messageOrBatch]
    const info = {
      count: messages.count,
      expectedVersion,
      streamName
    }
    log.debug(info, 'messaging write: starting')

    const data = transformMessages(messages)

    const position = await store.write(data, streamName, expectedVersion)

    log.info({
      ...info,
      types: data.map(d => d.type)
    }, 'messaging write: successful')

    if (emitter.listenerCount('written')) {
      const duration = process.hrtime.bigint() - start
      messages.forEach(message => {
        emitter.emit('written', { duration, expectedVersion, message, streamName })
      })
    }

    return position
  }

  write.emitter = emitter

  write.initial = (messageOrBatch, streamName) => {
    return write(messageOrBatch, streamName, { expectedVersion: -1 })
  }

  write.isExpectedVersionError = store.isExpectedVersionError

  return write
}

const transformMessages = (messages) => {
  try {
    return messages.map(toWriteMessageData)
  } catch (err) {
    throw writeError('one or more messages were invalid', err)
  }
}
