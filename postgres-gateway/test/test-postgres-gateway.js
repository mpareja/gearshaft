const { createPostgresGateway } = require('../')
const { getConfig } = require('./config')

exports.createTestPostgresGateway = () => {
  try {
    const config = getConfig().db

    return createInstance(config)
  } catch (e) /* istanbul ignore next */ {
    // soemtimes jest is not outputting errors in beforeAll
    console.log('Error creating message store', e)
    throw e
  }
}

const createInstance = (config) => {
  const db = createPostgresGateway(config)
  db.recreate = () => createInstance(config)
  return db
}
