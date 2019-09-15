const getConfig = require('./config')
const createPg = require('../pg')

const createMessageStoreDb = /* istanbul ignore next */ async () => {
  try {
    const config = getConfig().db

    return await createInstance(config)
  } catch (e) {
    // for some reason, jest is not outputting errors in beforeAll
    console.log('Error creating message store', e)
    throw e
  }
}
module.exports = createMessageStoreDb

const createInstance = async (config) => {
  const db = await createPg(config)
  db.recreate = () => createInstance(config)
  db.close = () => db.end()
  return db
}
