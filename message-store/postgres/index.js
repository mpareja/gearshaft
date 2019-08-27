const createGet = require('./get')
const createGetLast = require('./get-last')
const createPut = require('./put')
const createRead = require('../read')
const createWrite = require('./write')

module.exports = (config) => {
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
