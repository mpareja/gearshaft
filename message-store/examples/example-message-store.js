const { createMessageStore } = require('../memory')
const { exampleLog } = require('../../examples')

module.exports.exampleMessageStore = (opts = {}) => {
  const log = exampleLog()
  return createMessageStore({ log, ...opts })
}
