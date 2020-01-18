const { StaleDocumentError } = require('../')

// https://www.postgresql.org/docs/10/errcodes-appendix.html
const UNIQUE_VIOLATION = '23505'

const RETRIEVED_VERSION_FIELD = Symbol('postgres-document-store-retrieved-version')

exports.createPostgresDocumentStore = ({
  columns = {},
  entity: Entity,
  idField = 'id',
  postgresGateway,
  table
}) => {
  const columnId = columns.id || 'id'
  const columnData = columns.data || 'data'
  const columnVersion = columns.version || 'version'

  const get = async (id) => {
    const values = [id]

    const sql = `
      SELECT ${columnId} as id, ${columnVersion} as version, ${columnData} as data
      FROM ${table} WHERE ${columnId} = $1`

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

    const sql = `
      INSERT INTO ${table} (${columnId}, ${columnVersion}, ${columnData})
      VALUES ($1, $3::bigint, $2::jsonb)`

    try {
      await postgresGateway.query(sql, values)
    } catch (err) {
      if (err.code === UNIQUE_VIOLATION) {
        throw new StaleDocumentError('document already exists')
      }
      throw err
    }

    doc[RETRIEVED_VERSION_FIELD] = version
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
        ${columnData} = $2::jsonb,
        ${columnVersion} = $3::bigint
      WHERE ${columnId} = $1 AND ${columnVersion} = $4::bigint`

    const results = await postgresGateway.query(sql, values)

    if (results.rowCount === 0) {
      throw new StaleDocumentError('document does not exist or had unexpected version')
    }

    doc[RETRIEVED_VERSION_FIELD] = updateVersion
  }

  return { get, insert, update }
}
