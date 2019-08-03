const assert = require('assert')
const createRegistry = require('../messaging/event-registry')

const m = (msg) => `entity-store create: ${msg}`

module.exports = (options) => {
  validateOptions(options)

  const { registerHandlers } = options

  const registry = createRegistry()
  registerHandlers(registry)

  return {}
}

function validateOptions (options) {
  assert(typeof options === 'object', m('options object required'))
  assert(typeof options.category === 'string', m('category required'))
  assert(typeof options.entity === 'function', m('entity required'))
  assert(typeof options.registerHandlers === 'function', m('registerHandlers required'))
  assert(options.messageStore, m('messageStore required'))
  assert(typeof options.messageStore.read === 'function', m('messageStore missing read'))
}
