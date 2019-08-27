const cloneDeep = require('lodash.clonedeep')
const operationError = require('../../errors/operation-error')
const uuidValidate = require('uuid-validate')
const { uuid } = require('../../identifier')

const EXPECTED_VERSION_ERROR_CODE = 'ExpectedVersionError'
const writeError = operationError('message-store write')
const putError = operationError('message-store put')

module.exports = ({ log }) => {
  const streams = {}
  const messageIds = {}
  let globalPosition = 0

  const get = async function (streamName, position) {
    position = position || 0
    const stream = streams[streamName] || []
    const subset = stream.slice(position)
    return subset
  }

  const getLast = async function (streamName) {
    const stream = streams[streamName] || []

    let count = 0
    let position
    let result = null
    if (stream.length) {
      count = 1
      position = stream.length - 1
      result = stream[position]
    }

    log.info({
      count,
      position,
      streamName
    }, 'message-store getLast: successful')

    return result
  }

  const read = async function * (streamName, position) {
    const subset = await get(streamName, position)

    for (const message of subset) {
      yield message
    }
  }

  const put = async (...args) => putSync(...args)

  const putSync = (inputMessage, streamName, expectedVersion) => {
    const stream = prepareStream(streamName)

    const currentVersion = stream.length - 1
    if (typeof expectedVersion === 'number' && expectedVersion !== currentVersion) {
      const e = putError(`Wrong expected version: ${expectedVersion} (Stream: ${streamName}, Stream Version: ${currentVersion})`)
      e.code = EXPECTED_VERSION_ERROR_CODE
      throw e
    }

    const { id } = inputMessage
    if (id) {
      if (messageIds[id]) {
        throw writeError(`duplicate message id: ${id}`)
      }

      if (!uuidValidate(id)) {
        throw writeError('error writing to database: bad uuid')
      }
    }

    const message = cloneDeep(inputMessage)
    message.id = message.id || uuid()
    message.position = stream.length
    message.globalPosition = globalPosition++
    message.time = new Date()
    message.streamName = streamName

    const lastPosition = message.position

    stream.push(message)
    messageIds[message.id] = true

    return lastPosition
  }

  const write = async (msgOrBatch, streamName, expectedVersion) => {
    const stream = prepareStream(streamName)
    const originalPosition = stream.length

    let lastPosition

    const batch = Array.isArray(msgOrBatch) ? msgOrBatch : [msgOrBatch]
    for (const inputMessage of batch) {
      try {
        // we need syncronous access to array so nothing changes under our feet
        lastPosition = putSync(inputMessage, streamName, expectedVersion)
      } catch (e) {
        stream.splice(originalPosition)
        throw e
      }

      if (typeof expectedVersion === 'number') {
        expectedVersion += 1
      }
    }

    log.info({
      count: batch.length,
      expectedVersion,
      position: lastPosition,
      streamName,
      types: batch.map(m => m.type)
    }, 'message-store write: successful')

    return lastPosition
  }

  const prepareStream = (streamName) => {
    let stream = streams[streamName]
    if (!stream) {
      stream = []
      streams[streamName] = stream
    }
    return stream
  }

  const isExpectedVersionError = (err) => {
    return err.code === EXPECTED_VERSION_ERROR_CODE
  }

  return { get, getLast, isExpectedVersionError, put, read, write }
}
