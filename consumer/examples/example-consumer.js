const { createConsumer } = require('../consumer')
const { exampleLog } = require('../../examples')
const { exampleStreamName, exampleRandomValue } = require('../../messaging/examples')

exports.exampleConsumer = ({ name, log, registerHandlers, streamName, strict } = {}) => {
  log = log || exampleLog()
  name = name || exampleRandomValue()
  registerHandlers = registerHandlers || (() => {})
  streamName = streamName || exampleStreamName()
  strict = typeof strict === 'boolean' ? strict : false

  return createConsumer({ log, name, registerHandlers, streamName, strict })
}
