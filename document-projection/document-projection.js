const assert = require('assert')
const { operationError } = require('../errors')
const { retry } = require('../retry')
const { StaleDocumentError } = require('../document-store')

const createError = operationError('document-projection')

exports.createDocumentProjection = (options) => {
  assertOptions(options)

  const { documentStore, entity: Entity, projection, identify } = options

  const handler = async (message) => {
    const id = identify(message)

    await retry([StaleDocumentError], async () => {
      const foundDocument = await getDocument(id)
      const doc = foundDocument || new Entity()
      const save = foundDocument ? documentStore.update : documentStore.insert

      projection.project(doc, message)

      await save(doc)
    })
  }

  const registerHandlers = (register) => {
    projection.registerHandlers((MessageType) => {
      register(MessageType, handler)
    })
  }

  const getDocument = async (id) => {
    try {
      return await documentStore.get(id)
    } catch (inner) {
      throw createError('error retrieving document', inner)
    }
  }

  return { documentStore, registerHandlers, handler }
}

const errorMessage = (msg) => `document-projection: ${msg}`

const assertOptions = (options) => {
  assert(typeof options === 'object', errorMessage('options required'))
  assert(options.documentStore, errorMessage('documentStore required'))
  assert(typeof options.entity === 'function', errorMessage('entity required'))
  assert(options.projection, errorMessage('projection required'))
  assert(typeof options.identify === 'function', errorMessage('identify required'))
}
