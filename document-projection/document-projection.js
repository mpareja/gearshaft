const assert = require('assert')
const { operationError } = require('../errors')
const { retry } = require('../retry')
const { StaleDocumentError } = require('../document-store')

const createError = operationError('document-projection')

exports.createDocumentProjection = (options) => {
  assertOptions(options)

  const {
    documentStore,
    entity: Entity,
    identify,
    log,
    projection,
    versionField = 'globalPosition'
  } = options

  const handler = async (message) => {
    const id = identify(message)
    const globalPosition = message.metadata.globalPosition

    await retry([StaleDocumentError], async () => {
      const foundDocument = await getDocument(id)
      const doc = foundDocument || new Entity()
      const save = foundDocument ? documentStore.update : documentStore.insert

      const meta = {
        foundDocumentVersion: foundDocument ? foundDocument[versionField] : undefined,
        globalPosition,
        messageId: message.id
      }

      if (foundDocument && foundDocument[versionField] >= globalPosition) {
        log.info(meta, `${Entity.name} document-projection: message ignored, already processed`)
        return
      }

      projection.project(doc, message)

      doc[versionField] = globalPosition

      await save(doc)

      log.info(meta, `${Entity.name} document-projection: document updated successfully`)
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
  assert(typeof options.identify === 'function', errorMessage('identify required'))
  assert(options.log, errorMessage('log required'))
  assert(options.projection, errorMessage('projection required'))
}
