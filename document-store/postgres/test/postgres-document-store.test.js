const { createPostgresDocumentStore } = require('../')
const { createTestPostgresGateway } = require('../../../postgres-gateway/test/test-postgres-gateway')
const { exampleDocument, ExampleEntityClass } = require('../../examples')
const { generateTestSuite } = require('../../test/document-store-test-suite')

const createDocumentStore = (overrides) => {
  return createPostgresDocumentStore(Object.assign({
    entity: ExampleEntityClass,
    idField: 'basketId',
    postgresGateway: createTestPostgresGateway(),
    table: 'document_projection'
  }, overrides))
}

describe('postgres-document-store', () => {
  generateTestSuite({ createDocumentStore })

  describe('default id', () => {
    it('allows insertion and retrieval', async () => {
      const writeDocument = exampleDocument()
      writeDocument.id = writeDocument.basketId
      delete writeDocument.basketId

      const documentStore = createDocumentStore({ idField: undefined })
      await documentStore.insert(writeDocument)

      const readDocument = await documentStore.get(writeDocument.id)

      expect(readDocument).toBeDefined()
      expect(readDocument).toBeInstanceOf(ExampleEntityClass)
      expect(readDocument.someValue).toBe(writeDocument.someValue)
    })
  })

  describe('custom columns', () => {
    it('allows insertion, update and retrieval', async () => {
      const documentStore = createDocumentStore({
        table: 'document_custom_columns',
        columns: { id: 'custom_id', data: 'custom_data', version: 'custom_version' }
      })

      const writeDocument = exampleDocument()
      await documentStore.insert(writeDocument)

      const readDocument1 = await documentStore.get(writeDocument.basketId)

      expect(readDocument1).toBeDefined()
      expect(readDocument1).toBeInstanceOf(ExampleEntityClass)
      expect(readDocument1.someValue).toBe(writeDocument.someValue)

      writeDocument.someValue = exampleDocument().someValue
      await documentStore.update(writeDocument)

      const readDocument2 = await documentStore.get(writeDocument.basketId)

      expect(readDocument2).toBeDefined()
      expect(readDocument2).toBeInstanceOf(ExampleEntityClass)
      expect(readDocument2.someValue).toBe(writeDocument.someValue)
    })
  })

  describe('error inserting document', () => {
    it('propagates error', async () => {
      const queryError = new Error('bogus query error')
      const postgresGateway = createTestPostgresGateway()
      postgresGateway.query = async () => { throw queryError }

      const document = exampleDocument()
      const documentStore = createDocumentStore({ postgresGateway })

      const error = await documentStore.insert(document).catch(err => err)

      expect(error).toBe(queryError)
    })
  })
})
