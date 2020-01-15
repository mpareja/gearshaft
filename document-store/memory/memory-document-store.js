const cloneDeep = require('lodash.clonedeep')
const { StaleDocumentError } = require('../stale-document-error')

const versionKey = Symbol('memory-document-store document version')

exports.createMemoryDocumentStore = (idKey = 'id') => {
  const documents = {}
  let concurrencyError = false

  const get = async (id) => {
    return cloneDeep(documents[id])
  }

  const insert = async (doc) => {
    throwIfConcurrencyErrorScheduled()

    const id = doc[idKey]

    if (documents[id]) {
      throw new StaleDocumentError('document already exists')
    }

    const inserted = cloneDeep(doc)
    inserted[versionKey] = 1

    documents[id] = inserted
  }

  const update = async (doc) => {
    throwIfConcurrencyErrorScheduled()

    const id = doc[idKey]

    const found = documents[id]
    if (!found || found[versionKey] !== doc[versionKey]) {
      throw new StaleDocumentError('document does not exist or had unexpected version')
    }

    const updated = cloneDeep(doc)
    updated[versionKey] = found[versionKey] + 1

    documents[id] = updated
  }

  const setupConcurrencyError = () => {
    concurrencyError = true
  }

  const throwIfConcurrencyErrorScheduled = () => {
    if (concurrencyError) {
      concurrencyError = false
      throw new StaleDocumentError('document does not exist or had unexpected version')
    }
  }

  return { get, insert, update, setupConcurrencyError }
}
