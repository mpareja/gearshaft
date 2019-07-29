const createGet = require('./get')
const createPut = require('./put')
const createRead = require('../read')
const createWrite = require('./write')

module.exports = (config) => {
  const get = createGet(config)
  const put = createPut(config)
  const read = createRead({ ...config, get: get.get })
  const write = createWrite({ ...config, put: put.put })
  return {
    ...get,
    ...put,
    ...read,
    ...write
  }
}