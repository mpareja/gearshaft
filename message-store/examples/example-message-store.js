const { createMessageStore } = require('../memory')
const { createLog } = require('../../logging')

module.exports.exampleMessageStore = (opts = {}) => {
  const log = createLog()
  return createMessageStore({ log, ...opts })
}
