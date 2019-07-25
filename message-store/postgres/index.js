const createGet = require('./get')
const createPut = require('./put')
const createWrite = require('./write')

module.exports = (config) => {
  const get = createGet(config)
  const put = createPut(config)
  const write = createWrite({ ...config, put: put.put })
  return {
    ...get,
    ...put,
    ...write
  }
}
