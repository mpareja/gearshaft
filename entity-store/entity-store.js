const assert = require('assert')
const { createEventRegistry, fromReadMessageData } = require('../messaging')
const { StreamName } = require('../message-store')

const m = (msg) => `entity-store create: ${msg}`

module.exports = (options) => {
  validateOptions(options)

  const {
    category,
    entity: EntityClass,
    messageStore,
    registerHandlers
  } = options

  const registry = createEventRegistry()
  registerHandlers(registry.register)

  const fetch = async (id) => {
    const entity = new EntityClass()
    const streamName = StreamName.create(category, id)
    for await (const messageData of messageStore.read(streamName)) {
      const { handler, messageClass } = registry.get(messageData.type)

      if (!handler) { continue }

      const message = fromReadMessageData(messageData, messageClass)

      handler(entity, message)
    }

    return entity
  }

  return { fetch }
}

function validateOptions (options) {
  assert(typeof options === 'object', m('options object required'))
  assert(typeof options.category === 'string', m('category required'))
  assert(typeof options.entity === 'function', m('entity required'))
  assert(typeof options.registerHandlers === 'function', m('registerHandlers required'))
  assert(options.messageStore, m('messageStore required'))
  assert(typeof options.messageStore.read === 'function', m('messageStore missing read'))
}
