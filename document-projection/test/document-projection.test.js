const createTestLog = require('../../test/test-log')
const { AssertionError } = require('assert')
const { catchError } = require('../../errors')
const { createDocumentProjection } = require('../')
const { exampleDocumentProjection, FruitAdded, Manufactured } = require('../examples')
const { exampleMessage, follow } = require('../../messaging')

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

    it('requires log', () => {
      const error = catchError(() => exampleDocumentProjection({ log: null }))

      expect(error).toBeInstanceOf(AssertionError)
      expect(error.message).toMatch('document-projection: log required')
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
    const setupManufactured = async (overrides) => {
      const log = createTestLog()
      const options = Object.assign({ log }, overrides)
      const documentProjection = exampleDocumentProjection(options)
      const { documentStore, handler } = documentProjection

      const manufactured = exampleMessage(Manufactured)

      await handler(manufactured)

      return { documentStore, handler, log, manufactured }
    }

    const setupBananaAdded = async (overrides) => {
      const scenario = await setupManufactured(overrides)
      const { handler, manufactured } = scenario

      const fruitAdded = follow(manufactured, FruitAdded, { type: 'banana' })
      fruitAdded.metadata.globalPosition = manufactured.metadata.globalPosition + 1

      await handler(fruitAdded)

      return { ...scenario, fruitAdded }
    }

    describe('given document did not previously exist', () => {
      it('inserts the projected document', async () => {
        const { documentStore, manufactured } = await setupManufactured()

        const found = await documentStore.get(manufactured.basketId)

        expect(found).toBeDefined()
      })

      it('projects events on to the document', async () => {
        const { documentStore, manufactured } = await setupManufactured()

        const found = await documentStore.get(manufactured.basketId)

        expect(found.basketId).toEqual(manufactured.basketId)
      })

      it('logs success', async () => {
        const { log, manufactured } = await setupManufactured()

        expect(log.info).toHaveBeenCalledWith({
          foundDocumentVersion: undefined,
          messageId: manufactured.id,
          globalPosition: manufactured.metadata.globalPosition
        }, 'FruitBasketView document-projection: document updated successfully')
      })
    })

    describe('given document previously existed', () => {
      it('updates the projected document', async () => {
        const { documentStore, manufactured } = await setupBananaAdded()

        const found = await documentStore.get(manufactured.basketId)

        expect(found.fruit).toEqual(['banana'])
      })
    })

    describe('given document already received the event', () => {
      it('does not update the document', async () => {
        const { documentStore, fruitAdded, handler, manufactured } = await setupBananaAdded()

        await handler(fruitAdded)

        const found = await documentStore.get(manufactured.basketId)

        expect(found.fruit).toEqual(['banana'])
        expect(found.globalPosition).toEqual(fruitAdded.metadata.globalPosition)
      })

      it('logs the message as ignored', async () => {
        const { fruitAdded, handler, log } = await setupBananaAdded()
        fruitAdded.id = 'some-id'

        await handler(fruitAdded)

        expect(log.info).toHaveBeenCalledWith({
          foundDocumentVersion: fruitAdded.metadata.globalPosition,
          messageId: 'some-id',
          globalPosition: fruitAdded.metadata.globalPosition
        }, 'FruitBasketView document-projection: message ignored, already processed')
      })
    })

    describe('given a concurrency error when saving the document', () => {
      it('reload the document and retry the operation', async () => {
        const { documentStore, fruitAdded, handler, manufactured } = await setupBananaAdded()

        documentStore.setupConcurrencyError()

        await handler(fruitAdded)

        const found = await documentStore.get(manufactured.basketId)

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

    describe('custom version field', () => {
      describe('given document already received the event', () => {
        it('does not update the document', async () => {
          const versionField = 'someVersion'
          const { documentStore, fruitAdded, handler, manufactured } = await setupBananaAdded({
            versionField
          })

          await handler(fruitAdded)

          const found = await documentStore.get(manufactured.basketId)

          expect(found.fruit).toEqual(['banana'])
          expect(found.someVersion).toEqual(fruitAdded.metadata.globalPosition)
        })
      })
    })
  })
})
