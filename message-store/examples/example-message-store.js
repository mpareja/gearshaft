const { exampleLog } = require('../../examples')
const createMessageStore = require('../memory')

module.exports.exampleMessageStore = (opts = {}) => {
  const log = exampleLog()
  return createMessageStore({ log, ...opts })
}
