const { createConsumer } = require('../consumer')
const { createLog } = require('../../logging')
const { exampleCategory, exampleMessageStore, exampleRandomValue } = require('../../message-store')

exports.exampleConsumer = (overrides) => {
  const settings = Object.assign({
    log: createLog(),
    name: exampleRandomValue(),
    registerHandlers: () => {},
    messageStore: exampleMessageStore(),
    category: exampleCategory()
  }, overrides)

  return createConsumer(settings)
}
