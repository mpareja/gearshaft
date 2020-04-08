const { createMemoryDocumentStore } = require('../')
const { exampleDocument, exampleRandomValue } = require('../../examples')
const { generateTestSuite } = require('../../test/document-store-test-suite')
const { StaleDocumentError } = require('../../')

const createDocumentStore = () => createMemoryDocumentStore('basketId')

describe('memory-document-store', () => {
  generateTestSuite({ createDocumentStore })

  describe('given no identity key name', () => {
    it('uses the name "id"', async () => {
      const documentStore = createMemoryDocumentStore()
      const id = exampleRandomValue()

      const writeDocument = { id }
      await documentStore.insert(writeDocument)

      const readDocument = await documentStore.get(id)
      expect(readDocument).toBeDefined()
      expect(readDocument.id).toBe(id)
    })
  })

  describe('setupConcurrencyError', () => {
    describe('enabled', () => {
      describe('insert', () => {
        it('throws StaleDocumentError error', async () => {
          const documentStore = createDocumentStore()
          const document = exampleDocument()

          documentStore.setupConcurrencyError()
          const error = await documentStore.insert(document).catch(err => err)

          expect(error).toBeInstanceOf(StaleDocumentError)
        })

        it('only throws StaleDocumentError error once', async () => {
          const documentStore = createDocumentStore()
          const document = exampleDocument()

          documentStore.setupConcurrencyError()
          await documentStore.insert(document).catch(err => err) // ignore

          const error = await documentStore.insert(document).catch(err => err)

          expect(error).toBeUndefined()
        })
      })

      describe('update', () => {
        it('throws StaleDocumentError error', async () => {
          const documentStore = createDocumentStore()
          const document = exampleDocument()

          await documentStore.insert(document)

          const modifiedDocument = await documentStore.get(document.basketId)
          modifiedDocument.someValue = exampleRandomValue()

          // act
          documentStore.setupConcurrencyError()
          const error = await documentStore.update(modifiedDocument).catch(err => err)

          expect(error).toBeInstanceOf(StaleDocumentError)
        })

        it('only throws StaleDocumentError error once', async () => {
          const documentStore = createDocumentStore()
          const document = exampleDocument()

          await documentStore.insert(document)

          const modifiedDocument = await documentStore.get(document.basketId)
          modifiedDocument.someValue = exampleRandomValue()

          // act
          documentStore.setupConcurrencyError()
          await documentStore.update(modifiedDocument).catch(err => err) // ignore

          const error = await documentStore.update(modifiedDocument).catch(err => err)

          expect(error).toBeUndefined()
        })
      })
    })
  })

  it('gives adventurous people access to all documents (unsupported)', async () => {
    const documentStore = createDocumentStore()
    const document = exampleDocument()

    await documentStore.insert(document)

    expect(documentStore.documents).toEqual({
      [document.basketId]: document
    })
  })
})
