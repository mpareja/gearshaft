const { createConsumer } = require('../consumer')
const { exampleLog } = require('../../examples')
const { exampleCategory, exampleRandomValue } = require('../../messaging/examples')
const { exampleMessageStore } = require('../../message-store/examples')

exports.exampleConsumer = ({ name, log, registerHandlers, store, category, ...args } = {}) => {
  log = log || exampleLog()
  name = name || exampleRandomValue()
  registerHandlers = registerHandlers || (() => {})
  store = store || exampleMessageStore()
  category = category || exampleCategory()

  return createConsumer({ log, name, registerHandlers, store, category, ...args })
}
