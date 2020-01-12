const { Pool, types } = require('pg')

types.setTypeParser(20, (data) => {
  /* global BigInt */
  /* istanbul ignore next */
  if (BigInt(data) > BigInt(Number.MAX_SAFE_INTEGER)) {
    // waiting for jest 25 release to add support for BigInt
    throw new Error('BigInt in database will overflow Number.MAX_SAFE_INTEGER')
  }
  return Number(data)
})

exports.createPostgresGateway = (config) => {
  const pool = new Pool(config)

  pool.transaction = async (fn) => {
    const client = await pool.connect()
    await client.query('BEGIN')
    try {
      await fn(client)
      await client.query('COMMIT')
    } catch (e) {
      await client.query('ROLLBACK')
      throw e
    } finally {
      client.release()
    }
  }

  return pool
}
