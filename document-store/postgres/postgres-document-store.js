const { StaleDocumentError } = require('../')

// https://www.postgresql.org/docs/10/errcodes-appendix.html
const UNIQUE_VIOLATION = '23505'

const RETRIEVED_VERSION_FIELD = Symbol('postgres-document-store-retrieved-version')

exports.createPostgresDocumentStore = ({
  entity: Entity,
  idField = 'id',
  postgresGateway,
  table
}) => {
  const get = async (id) => {
    const values = [id]

    const sql = `SELECT id, version, data FROM ${table} WHERE id = $1`

    const results = await postgresGateway.query(sql, values)

    const record = results.rows[0]

    if (record) {
      const entity = Object.assign(new Entity(), record.data)
      entity[RETRIEVED_VERSION_FIELD] = record.version

      return entity
    }
  }

  const insert = async (doc) => {
    const id = doc[idField]
    const version = 0
    const values = [id, doc, version]

    const sql = `INSERT INTO ${table} (id, version, data) VALUES ($1, $3::bigint, $2::jsonb)`

    try {
      await postgresGateway.query(sql, values)
    } catch (err) {
      if (err.code === UNIQUE_VIOLATION) {
        throw new StaleDocumentError('document already exists')
      }
      throw err
    }
  }

  const update = async (doc) => {
    const id = doc[idField]
    const retrievedVersion = doc[RETRIEVED_VERSION_FIELD]
    const updateVersion = retrievedVersion + 1

    if (typeof retrievedVersion !== 'number') {
      throw new StaleDocumentError('document does not exist or had unexpected version')
    }

    const values = [id, doc, updateVersion, retrievedVersion]

    const sql = `
      UPDATE ${table} SET
        data = $2::jsonb,
        version = $3::bigint
      WHERE id = $1 AND version = $4::bigint`

    const results = await postgresGateway.query(sql, values)

    if (results.rowCount === 0) {
      throw new StaleDocumentError('document does not exist or had unexpected version')
    }
  }

  return { get, insert, update }
}
