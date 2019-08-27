const { exampleLog } = require('../../examples')
const createMessageStore = require('../memory')

module.exports.exampleMessageStore = () => {
  const log = exampleLog()
  return createMessageStore({ log })
}
