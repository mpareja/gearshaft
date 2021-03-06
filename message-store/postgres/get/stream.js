const { assertTruthy } = require('../../../errors')
const { createGet } = require('./get')
const { StreamName } = require('../../stream-name')

exports.createGetStream = (options) => {
  const assert = (streamName) => {
    assertTruthy(!StreamName.isCategory(streamName), get,
      `stream required, not a category (${streamName})`)
  }

  const getValues = (streamName, options) => [
    streamName,
    options.position,
    options.batchSize,
    options.condition
  ]

  const parameters = '$1::varchar, $2::bigint, $3::bigint, $4::varchar'
  const sql = `SELECT * FROM get_stream_messages(${parameters});`

  const get = createGet({ ...options, assert, getValues, sql })

  return get
}
