const createLog = require('../../test/test-log')
const { exampleCategory, exampleMessageStore } = require('../../message-store')
const { exampleConsumer, exampleHandler } = require('../examples')
const { exampleMessageClass } = require('../../messaging')

const HandledMessageClass = exampleMessageClass('HandledMessageClass')

exports.HandledMessageClass = HandledMessageClass

exports.setupConsumerWithHandler = (opts = {}) => {
  const log = createLog()
  // log.enableDebugging()
  const category = opts.category || exampleCategory()
  const handler = opts.handler || exampleHandler()
  const registerHandlers = (register) => {
    register(HandledMessageClass, handler)
  }
  const messageStore = exampleMessageStore({ log })
  const consumer = exampleConsumer({
    log,
    pollingIntervalMs: 20, // keep test fast
    registerHandlers,
    messageStore,
    category,
    ...opts
  })
  return { consumer, handler, log, messageStore, category }
}
