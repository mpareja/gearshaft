const cloneDeep = require('lodash.clonedeep')
const operationError = require('../../errors/operation-error')
const { uuid } = require('../../identifier')

const writeError = operationError('message-store write')

module.exports = () => {
  const streams = {}
  const messageIds = {}
  let globalPosition = 0

  const read = async function * (streamName, position) {
    position = position || 0
    const stream = streams[streamName] || []
    const subset = stream.slice(position)

    for (const message of subset) {
      yield message
    }
  }

  const write = async (msgOrBatch, streamName, expectedVersion) => {
    let stream = streams[streamName]
    if (!stream) {
      stream = []
      streams[streamName] = stream
    }

    const currentVersion = stream.length - 1
    if (typeof expectedVersion === 'number' && expectedVersion !== currentVersion) {
      throw writeError(`Wrong expected version: ${expectedVersion} (Stream: ${streamName}, Stream Version: ${currentVersion})`)
    }
    let lastPosition

    const batch = Array.isArray(msgOrBatch) ? msgOrBatch : [msgOrBatch]
    for (const inputMessage of batch) {
      const id = inputMessage.id || uuid()
      if (messageIds[id]) {
        throw writeError(`duplicate message id: ${id}`)
      }

      const message = cloneDeep(inputMessage)
      message.id = message.id || uuid()
      message.position = stream.length
      message.globalPosition = globalPosition++
      message.time = new Date()
      message.streamName = streamName

      lastPosition = message.position

      stream.push(message)
      messageIds[message.id] = true
    }

    return lastPosition
  }

  return { read, write }
}
