const { deserialize } = require('./deserialize')
const { operationError } = require('../../errors')

module.exports = ({ postgresGateway, log }) => {
  const getLastError = operationError('message-store getLast')

  const getLast = async (streamName) => {
    log.debug({ streamName }, 'message-store getLast: starting')

    let count = 0
    let position
    let result = null

    let dbResults
    try {
      dbResults = await queryLast(streamName)
    } catch (inner) {
      throw getLastError('error reading from database', inner)
    }

    if (dbResults.length) {
      count = 1
      result = deserialize(dbResults[0])
      position = result.position
    }

    log.info({
      count,
      position,
      streamName
    }, 'message-store getLast: successful')

    return result
  }

  const queryLast = async (streamName) => {
    const values = [streamName]
    const parameters = '$1::varchar'

    const sql = `SELECT * FROM get_last_stream_message(${parameters});`

    const results = await postgresGateway.query(sql, values)
    return results.rows
  }

  return { getLast }
}
