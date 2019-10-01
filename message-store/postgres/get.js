const operationError = require('../../errors/operation-error')
const { deserialize } = require('./deserialize')
const { StreamName } = require('../stream-name')

module.exports = ({ db, log, batchSize = 1000 }) => {
  const getError = operationError('message-store get')

  const get = async (streamName, position = 0) => {
    log.debug({ batchSize, position, streamName }, 'message-store get: starting')

    let dbResults
    try {
      dbResults = await query(streamName, position, batchSize)
    } catch (inner) {
      throw getError('error reading from database', inner)
    }

    const results = dbResults.map(deserialize)
    const count = results.length

    log.info({ batchSize, count, position, streamName }, 'message-store get: successful')
    return results
  }

  const query = async (streamName, position, batchSize) => {
    const values = [streamName, position, batchSize, null]
    const parameters = '$1::varchar, $2::bigint, $3::bigint, $4::varchar'

    const sql = StreamName.isCategory(streamName)
      ? `SELECT * FROM get_category_messages(${parameters});`
      : `SELECT * FROM get_stream_messages(${parameters});`

    const result = await db.query(sql, values)
    return result.rows
  }

  return { get }
}
