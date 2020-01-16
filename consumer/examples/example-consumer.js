const { createConsumer } = require('../consumer')
const { createLog } = require('../../logging')
const { exampleCategory, exampleMessageStore, exampleRandomValue } = require('../../message-store')

exports.exampleConsumer = ({ name, log, registerHandlers, messageStore, category, ...args } = {}) => {
  log = log || createLog()
  name = name || exampleRandomValue()
  registerHandlers = registerHandlers || (() => {})
  messageStore = messageStore || exampleMessageStore()
  category = category || exampleCategory()

  return createConsumer({ log, name, registerHandlers, messageStore, category, ...args })
}
