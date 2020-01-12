const createGet = require('./get')
const createGetLast = require('./get-last')
const createPut = require('./put')
const createRead = require('../read')
const createWrite = require('./write')
const { createLog } = require('../../logging')
const { createPostgresGateway } = require('../../postgres-gateway')

module.exports.createMessageStore = (config) => {
  // allow passing in postgresGateway instance or settings
  const { ...databaseSettings } = config
  delete databaseSettings.log
  config.postgresGateway = config.postgresGateway || createPostgresGateway(databaseSettings)
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
