const assert = require('assert')
const { createEventRegistry, fromReadMessageData } = require('../messaging')
const { StreamName } = require('../message-store')

const m = (msg) => `entity-store create: ${msg}`

exports.createEntityStore = (options) => {
  validateOptions(options)

  const {
    category,
    entity: EntityClass,
    messageStore,
    projection
  } = options

  const registry = createEventRegistry()
  projection.registerHandlers(registry.register)

  const fetchRecord = async (id) => {
    const entity = new EntityClass()
    const streamName = StreamName.create(category, id)
    const recordMetadata = { version: -1 }
    for await (const messageData of messageStore.read(streamName)) {
      const { handler, messageClass } = registry.get(messageData.type)

      recordMetadata.version = messageData.position

      if (!handler) { continue }

      const message = fromReadMessageData(messageData, messageClass)

      handler(entity, message)
    }

    return [entity, recordMetadata]
  }

  const fetch = async (id) => {
    const [entity] = await fetchRecord(id)
    return entity
  }

  return { fetch, fetchRecord }
}

function validateOptions (options) {
  assert(typeof options === 'object', m('options object required'))
  assert(typeof options.category === 'string', m('category required'))
  assert(typeof options.entity === 'function', m('entity required'))
  assert(typeof options.projection === 'object', m('projection required'))
  assert(typeof options.projection.registerHandlers === 'function', m('projection required'))
  assert(options.messageStore, m('messageStore required'))
  assert(typeof options.messageStore.read === 'function', m('messageStore missing read'))
}
