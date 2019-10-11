const { createConsumer } = require('../consumer')
const { exampleLog } = require('../../examples')
const { exampleCategory, exampleMessageStore, exampleRandomValue } = require('../../message-store')

exports.exampleConsumer = ({ name, log, registerHandlers, messageStore, category, ...args } = {}) => {
  log = log || exampleLog()
  name = name || exampleRandomValue()
  registerHandlers = registerHandlers || (() => {})
  messageStore = messageStore || exampleMessageStore()
  category = category || exampleCategory()

  return createConsumer({ log, name, registerHandlers, messageStore, category, ...args })
}
