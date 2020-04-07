const { deserialize } = require('../deserialize')
const { operationError } = require('../../../errors')

exports.createGet = ({ assert, postgresGateway, getValues, log, sql, batchSize: configuredBatchSize }) => {
  const getError = operationError('message-store get')

  const get = async (streamName, options = {}) => {
    const position = options.position || 0
    const batchSize = options.batchSize || configuredBatchSize

    log.debug({ batchSize, position, streamName }, 'message-store get: starting')

    assert(streamName)

    let dbResults
    try {
      dbResults = await query(streamName, { ...options, batchSize, position })
    } catch (inner) {
      throw getError('error reading from database', inner)
    }

    const results = dbResults.map(deserialize)
    const count = results.length

    log.info({ batchSize, count, position, streamName }, 'message-store get: successful')
    return results
  }

  const query = async (streamName, options) => {
    const values = getValues(streamName, options)

    const result = await postgresGateway.query(sql, values)
    return result.rows
  }

  return get
}
