const { AssertionError } = require('assert')
const { catchError } = require('../../errors')
const { createDocumentProjection } = require('../')
const { exampleDocumentProjection, FruitAdded, Manufactured } = require('../examples')
const { exampleMessage } = require('../../messaging')

describe('document-projection', () => {
  describe('createDocumentProjection', () => {
    it('requires options', () => {
      const error = catchError(() => createDocumentProjection())

      expect(error).toBeInstanceOf(AssertionError)
      expect(error.message).toMatch('document-projection: options required')
    })

    it('requires documentStore', () => {
      const error = catchError(() => exampleDocumentProjection({ documentStore: null }))

      expect(error).toBeInstanceOf(AssertionError)
      expect(error.message).toMatch('document-projection: documentStore required')
    })

    it('requires entity class', () => {
      const error = catchError(() => exampleDocumentProjection({ entity: null }))

      expect(error).toBeInstanceOf(AssertionError)
      expect(error.message).toMatch('document-projection: entity required')
    })

    it('requires identify', () => {
      const error = catchError(() => exampleDocumentProjection({ identify: null }))

      expect(error).toBeInstanceOf(AssertionError)
      expect(error.message).toMatch('document-projection: identify required')
    })

    it('requires projection', () => {
      const error = catchError(() => exampleDocumentProjection({ projection: null }))

      expect(error).toBeInstanceOf(AssertionError)
      expect(error.message).toMatch('document-projection: projection required')
    })
  })

  describe('registerHandlers', () => {
    it('registers a handler for all handlers in the projection', () => {
      const documentProjection = exampleDocumentProjection()
      const register = jest.fn()

      documentProjection.registerHandlers(register)

      expect(register).toHaveBeenCalledTimes(2)
      expect(register).toHaveBeenCalledWith(FruitAdded, documentProjection.handler)
      expect(register).toHaveBeenCalledWith(Manufactured, documentProjection.handler)
    })
  })

  describe('handler', () => {
    const setupManufactured = async () => {
      const documentProjection = exampleDocumentProjection()
      const { documentStore, handler } = documentProjection

      const message = exampleMessage(Manufactured)

      await handler(message)

      return { documentStore, handler, message }
    }

    describe('given document did not previously exist', () => {
      it('inserts the projected document', async () => {
        const { documentStore, message } = await setupManufactured()

        const found = await documentStore.get(message.basketId)

        expect(found).toBeDefined()
      })

      it('projects events on to the document', async () => {
        const { documentStore, message } = await setupManufactured()

        const found = await documentStore.get(message.basketId)

        expect(found.basketId).toEqual(message.basketId)
      })
    })

    describe('given document previously existed', () => {
      it('updates the projected document', async () => {
        const { documentStore, handler, message } = await setupManufactured()
        const fruitAdded = exampleMessage(FruitAdded)
        fruitAdded.basketId = message.basketId
        fruitAdded.type = 'banana'

        await handler(fruitAdded)

        const found = await documentStore.get(message.basketId)

        expect(found.fruit).toEqual(['banana'])
      })
    })

    describe('given a concurrency error when saving the document', () => {
      it('reload the document and retry the operation', async () => {
        const { documentStore, handler, message } = await setupManufactured()
        const fruitAdded = exampleMessage(FruitAdded)
        fruitAdded.basketId = message.basketId
        fruitAdded.type = 'banana'

        documentStore.setupConcurrencyError()

        await handler(fruitAdded)

        const found = await documentStore.get(message.basketId)

        expect(found.fruit).toEqual(['banana'])
      })
    })

    describe('given an error getting document from database', () => {
      it('propagates error', async () => {
        const documentProjection = exampleDocumentProjection()
        const message = exampleMessage(FruitAdded)

        const innerError = new Error('bogus get error')
        documentProjection.documentStore.get = async () => { throw innerError }

        const error = await documentProjection.handler(message).catch(err => err)

        expect(error).toBeInstanceOf(Error)
        expect(error.message).toBe('document-projection: error retrieving document')
        expect(error.inner).toBe(innerError)
      })
    })
  })
})
