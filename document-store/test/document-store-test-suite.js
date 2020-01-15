const { exampleDocument, exampleDocumentId, exampleRandomValue } = require('../examples')
const { StaleDocumentError } = require('../')

exports.generateTestSuite = ({
  createDocumentStore
}) => {
  describe('get', () => {
    describe('given no documents', () => {
      it('returns undefined', async () => {
        const documentStore = createDocumentStore()
        const id = exampleDocumentId()

        const document = await documentStore.get(id)

        expect(document).toBeUndefined()
      })
    })

    describe('given a document with the specified id', () => {
      it('returns the document', async () => {
        const writeDocument = exampleDocument()

        const documentStore = createDocumentStore()
        await documentStore.insert(writeDocument)

        const readDocument = await documentStore.get(writeDocument.basketId)

        expect(readDocument).toBeDefined()
        expect(readDocument.someValue).toBe(writeDocument.someValue)
      })
    })
  })

  describe('insert', () => {
    describe('document does not exist', () => {
      it('inserts successfully', async () => {
        const document = exampleDocument()
        const documentStore = createDocumentStore()

        await documentStore.insert(document)
      })
    })

    describe('document exists', () => {
      it('inserts throws StaleDocumentError', async () => {
        const document = exampleDocument()

        const documentStore = createDocumentStore()
        await documentStore.insert(document)

        const error = await documentStore.insert(document).catch(err => err)

        expect(error).toBeInstanceOf(StaleDocumentError)
      })
    })
  })

  describe('update', () => {
    describe('document does not exist', () => {
      it('throws StaleDocumentError', async () => {
        const document = exampleDocument()
        const documentStore = createDocumentStore()

        const error = await documentStore.update(document).catch(err => err)

        expect(error).toBeInstanceOf(StaleDocumentError)
      })
    })

    describe('document exists at expected version ', () => {
      it('updates successfully', async () => {
        // arrange
        const documentStore = createDocumentStore()

        const originalDocument = exampleDocument()
        await documentStore.insert(originalDocument)

        const modifiedDocument = await documentStore.get(originalDocument.basketId)
        modifiedDocument.someValue = exampleRandomValue()

        // act
        await documentStore.update(modifiedDocument)

        // assert
        const readDocument = await documentStore.get(originalDocument.basketId)
        expect(readDocument.someValue).toBe(modifiedDocument.someValue)
      })
    })

    describe('document exists at unexpected version (optimistic concurrency control)', () => {
      it('updates successfully', async () => {
        // arrange:
        // 1. insert doc version A
        // 2. "thread 1": load doc version A
        // 3. "thread 2": load doc version A
        // 4. "thread 2": update doc version B
        // 5. "thread 1": fail to update doc (because its no longer at version A)
        const documentStore = createDocumentStore()

        const originalDocument = exampleDocument()
        await documentStore.insert(originalDocument)

        const documentThread1 = await documentStore.get(originalDocument.basketId)
        documentThread1.someValue = exampleRandomValue()

        const documentThread2 = await documentStore.get(originalDocument.basketId)
        documentThread2.someValue = exampleRandomValue()
        await documentStore.update(documentThread2)

        // act
        const error = await documentStore.update(documentThread1).catch(err => err)

        // assert
        expect(error).toBeInstanceOf(StaleDocumentError)

        const readDocument = await documentStore.get(originalDocument.basketId)
        expect(readDocument.someValue).toBe(documentThread2.someValue)
      })
    })
  })
}
