const operationError = require('../../../errors/operation-error')
const { deserialize } = require('../deserialize')

exports.createGet = ({ assert, db, getValues, log, sql, batchSize }) => {
  const getError = operationError('message-store get')

  const get = async (streamName, { position = 0 } = {}) => {
    log.debug({ batchSize, position, streamName }, 'message-store get: starting')

    assert(streamName)

    let dbResults
    try {
      dbResults = await query(streamName, position)
    } catch (inner) {
      throw getError('error reading from database', inner)
    }

    const results = dbResults.map(deserialize)
    const count = results.length

    log.info({ batchSize, count, position, streamName }, 'message-store get: successful')
    return results
  }

  const query = async (streamName, position) => {
    const values = getValues(streamName, position)

    const result = await db.query(sql, values)
    return result.rows
  }

  return get
}
