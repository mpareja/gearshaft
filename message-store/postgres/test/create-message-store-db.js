const getConfig = require('../../../../test/config')
const createTestDb = require('../../../../db/test/create-test-db') // test connection via this
const createPg = require('../pg')

const createMessageStoreDb = /* istanbul ignore next */ async () => {
  try {
    let config = getConfig().db
    let close = () => {}

    if (config.generate) {
      const createdDb = await createTestDb()
      config = createdDb.config
      close = createdDb.close
    }

    return createInstance(config, close)
  } catch (e) {
    // for some reason, jest is not outputting errors in beforeAll
    console.log('Error creating message store', e)
    throw e
  }
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
  return createPg(config)
}
