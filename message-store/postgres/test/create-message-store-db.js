const getConfig = require('./config')
const { createPostgresGateway } = require('../pg')

const createMessageStoreDb = /* istanbul ignore next */ () => {
  try {
    const config = getConfig().db

    return createInstance(config)
  } catch (e) {
    // for some reason, jest is not outputting errors in beforeAll
    console.log('Error creating message store', e)
    throw e
  }
}
module.exports = createMessageStoreDb

const createInstance = (config) => {
  const db = createPostgresGateway(config)
  db.recreate = () => createInstance(config)
  db.close = () => db.end()
  return db
}
