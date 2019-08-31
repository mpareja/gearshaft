const { createConsumer } = require('../consumer')
const { exampleLog } = require('../../examples')
const { exampleStreamName, exampleRandomValue } = require('../../messaging/examples')
const { exampleMessageStore } = require('../../message-store/examples')

exports.exampleConsumer = ({ name, log, registerHandlers, store, streamName, ...args } = {}) => {
  log = log || exampleLog()
  name = name || exampleRandomValue()
  registerHandlers = registerHandlers || (() => {})
  store = store || exampleMessageStore()
  streamName = streamName || exampleStreamName()

  return createConsumer({ log, name, registerHandlers, store, streamName, ...args })
}
