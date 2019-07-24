const operationError = require('../../errors/operation-error')
const StreamName = require('./stream-name')
const { uuid } = require('../../identifier')

const EXPECTED_VERSION_ERROR_CODE = 'ExpectedVersionError'

module.exports = ({ db, log, batchSize = 1000 }) => {
  const getError = operationError('message-store get')
  const putError = operationError('message-store put')

  const get = async (streamName, position = 0) => {
    log.debug({ batchSize, position, streamName }, 'message-store get: starting')

    let dbResults
    try {
      dbResults = await query(streamName, position, batchSize)
    } catch (inner) {
      throw getError('error reading from database', inner)
    }

    const results = dbResults.rows.map(deserialize)
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

    return db.query(sql, values)
  }

  const put = async (message, streamName, expectedVersion) => {
    log.debug({ type: message.type, streamName, expectedVersion }, 'message-store put: starting')

    message.id = message.id || uuid()

    const results = await insert(message, streamName, expectedVersion)

    const position = results.rows[0].write_message

    const { id } = message
    log.info({ type: message.type, streamName, expectedVersion, id, position },
      'message-store put: successful')

    return position
  }

  const insert = async (message, streamName, expectedVersion) => {
    const { id, type } = message
    const data = serialize(message.data)
    const metadata = serialize(message.metadata)

    const values = [id, streamName, type, data, metadata, expectedVersion]
    const sql =
    'SELECT write_message($1::varchar, $2::varchar, $3::varchar, $4::jsonb, $5::jsonb, $6::bigint);'

    let results
    try {
      results = await db.query(sql, values)
    } catch (e) {
      throw transformError(e)
    }
    return results
  }

  const serialize = (data) => JSON.stringify(data)
  const deserialize = (row) => {
    return {
      id: row.id,
      streamName: row.stream_name,
      type: row.type,
      position: row.position,
      globalPosition: row.global_position,
      data: JSON.parse(row.data),
      metadata: JSON.parse(row.metadata),
      time: new Date(row.time)
    }
  }

  const transformError = (error) => {
    if (error.message.indexOf('Wrong expected version') >= 0) {
      const msg = error.message.replace('ERROR:', '')
      const e = putError(msg)
      e.code = EXPECTED_VERSION_ERROR_CODE
      return e
    }
    return putError('error writing to database', error)
  }

  const isExpectedVersionError = (err) => {
    return err.code === EXPECTED_VERSION_ERROR_CODE
  }

  return { get, put, isExpectedVersionError }
}
