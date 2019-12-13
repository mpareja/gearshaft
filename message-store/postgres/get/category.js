const { createGet } = require('./get')

exports.createGetCategory = (options) => {
  const { batchSize } = options

  const getValues = (streamName, position) => [
    streamName,
    position,
    batchSize,
    null
  ]

  const parameters = '$1::varchar, $2::bigint, $3::bigint, $4::varchar'
  const sql = `SELECT * FROM get_category_messages(${parameters});`

  const get = createGet({ ...options, getValues, sql })

  return get
}
