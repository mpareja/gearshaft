const createTestDb = require('../../../../db/test/create-test-db') // test connection via this
const { Client } = require('pg')

const createMessageStoreDb = async () => {
  const { config, close } = await createTestDb()
  return createInstance(config, close)
}
module.exports = createMessageStoreDb

const createInstance = async (config, close) => {
  const db = await createConnection(config)
  db.recreate = () => createInstance(config, close)
  db.close = async () => {
    await db.end()
    await close()
  }
  return db
}

const createConnection = async (typeormConfig) => {
  const config = {
    database: typeormConfig.database,
    host: typeormConfig.host,
    password: typeormConfig.password,
    user: typeormConfig.username
  }

  const client = new Client(config)
  await client.connect()
  return client
}
