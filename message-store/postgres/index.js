const createGet = require('./get')
const createGetLast = require('./get-last')
const createPut = require('./put')
const createRead = require('../read')
const createWrite = require('./write')
const { createLog } = require('../../logging')
const { createPostgresGateway } = require('./pg')

module.exports.createMessageStore = (config) => {
  // allow passing in db instance or settings
  const { ...databaseSettings } = config
  delete databaseSettings.log
  config.db = config.db || createPostgresGateway(databaseSettings)
  config.log = config.log || createLog()

  const get = createGet(config)
  const getLast = createGetLast(config)
  const put = createPut(config)
  const read = createRead({ ...config, get: get.get })
  const write = createWrite({ ...config, put: put.put })
  return {
    ...get,
    ...getLast,
    ...put,
    ...read,
    ...write
  }
}

module.exports.createPostgresGateway = createPostgresGateway
