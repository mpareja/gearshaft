const operationError = require('../../errors/operation-error')
const { uuid } = require('../../identifier')

const EXPECTED_VERSION_ERROR_CODE = 'ExpectedVersionError'

module.exports = ({ db, log }) => {
  const putError = operationError('message-store put')

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

  const transformError = (error) => {
    if (error.message.indexOf('Wrong expected version') >= 0) {
      const msg = error.message.replace('ERROR:', '')
      const e = putError(msg)
      e.code = EXPECTED_VERSION_ERROR_CODE
      return e
    }
    return putError(`error writing to database: ${error.message}`, error)
  }

  const isExpectedVersionError = (err) => {
    return err.code === EXPECTED_VERSION_ERROR_CODE
  }

  return { put, isExpectedVersionError }
}
