const createRead = require('../read')
const cloneDeep = require('lodash.clonedeep')
const operationError = require('../../errors/operation-error')
const uuidValidate = require('uuid-validate')
const { assertTruthy } = require('../../errors')
const { createLog } = require('../../logging')
const { ExpectedVersionError } = require('../expected-version-error')
const { promisify } = require('util')
const { StreamName } = require('../stream-name')
const { uuid } = require('../../identifier')

const setImmediateP = promisify(setImmediate)
const writeError = operationError('message-store write')

module.exports.createMessageStore = ({ batchSize = 1000, log = createLog() } = {}) => {
  const messages = []
  const messageIds = {}
  let globalPosition = 0

  const get = async function (streamName, position) {
    await setImmediateP() // mimic async IO

    position = position || 0

    let subset
    if (StreamName.isCategory(streamName)) {
      subset = messages.filter(m =>
        StreamName.getCategory(m.streamName) === streamName &&
        m.globalPosition >= position
      )
      subset = subset.splice(0, batchSize)
    } else {
      subset = messages.filter(m =>
        m.streamName === streamName &&
        m.position >= position &&
        m.position < (position + batchSize)
      )
    }

    log.info({ batchSize, count: subset.length, position, streamName },
      'message-store get: successful')

    return subset
  }

  const getCategory = async (category, position) => {
    assertTruthy(StreamName.isCategory(category), getCategory,
      `stream category required, not a specific stream (${category})`)

    return get(category, position)
  }

  const getStream = async (streamName, position) => {
    assertTruthy(!StreamName.isCategory(streamName), get,
      `stream required, not a category (${streamName})`)

    return get(streamName, position)
  }

  const getLast = async (streamName) => {
    await setImmediateP() // mimic async IO

    const last = getLastSync(streamName)

    log.info({
      count: last ? 1 : 0,
      position: last ? last.position : undefined,
      streamName
    }, 'message-store getLast: successful')

    return last
  }

  const getLastSync = (streamName) => {
    let last = null

    for (var m of messages) {
      if (m.streamName === streamName) {
        last = m
      }
    }

    return last
  }

  const { read } = createRead({ batchSize, get })

  const put = async (...args) => {
    await setImmediateP() // mimic async IO
    return putSync(...args)
  }

  const putSync = (inputMessage, streamName, expectedVersion) => {
    const last = getLastSync(streamName)

    const currentVersion = last ? last.position : -1
    if (typeof expectedVersion === 'number' && expectedVersion !== currentVersion) {
      const msg = `Wrong expected version: ${expectedVersion} (Stream: ${streamName}, Stream Version: ${currentVersion})`
      const e = new ExpectedVersionError(`message-store put: ${msg}`)
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
    message.position = currentVersion + 1
    message.globalPosition = globalPosition++
    message.time = new Date()
    message.streamName = streamName

    const lastPosition = message.position

    messages.push(message)
    messageIds[message.id] = true

    log.info({
      expectedVersion,
      id: message.id,
      position: lastPosition,
      streamName,
      type: message.type
    }, 'message-store put: successful')

    return lastPosition
  }

  const write = async (...args) => {
    await setImmediateP() // mimic async IO
    return writeSync(...args)
  }

  const writeSync = (msgOrBatch, streamName, expectedVersion) => {
    const originalPosition = messages.length

    let lastPosition

    const batch = Array.isArray(msgOrBatch) ? msgOrBatch : [msgOrBatch]
    for (const inputMessage of batch) {
      try {
        // we need syncronous access to array so nothing changes under our feet
        lastPosition = putSync(inputMessage, streamName, expectedVersion)
      } catch (e) {
        messages.splice(originalPosition)
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

  return { get, getCategory, getLast, getStream, put, read, write }
}
