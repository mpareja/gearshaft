const createGet = require('./get')
const createPut = require('./put')

module.exports = (config) => {
  const get = createGet(config)
  const put = createPut(config)
  return {
    ...get,
    ...put
  }
}
