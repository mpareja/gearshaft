const { createEntityStore } = require('../entity-store')
const { exampleCategory, exampleMessageStore } = require('../../message-store')
const { ExampleEntityClass } = require('../../entity-projection')

describe('entity-store', () => {
  describe('create', () => {
    let options
    beforeEach(() => {
      options = {
        category: exampleCategory(),
        entity: ExampleEntityClass,
        messageStore: exampleMessageStore(),
        projection: { registerHandlers: jest.fn() }
      }
    })

    it('returns entity store', () => {
      const entityStore = createEntityStore(options)
      expect(entityStore).toBeDefined()
    })

    it('calls projection.registerHandlers with registry', () => {
      createEntityStore(options)
      expect(options.projection.registerHandlers).toHaveBeenCalledWith(
        expect.any(Function)
      )
    })

    describe('creation error scenarios', () => {
      it('no options provided', () => {
        expect(() => {
          createEntityStore()
        }).toThrow(new Error('entity-store create: options object required'))
      })

      it('no category provided', () => {
        delete options.category
        expect(() => {
          createEntityStore(options)
        }).toThrow(new Error('entity-store create: category required'))
      })

      it('no entity provided', () => {
        delete options.entity
        expect(() => {
          createEntityStore(options)
        }).toThrow(new Error('entity-store create: entity required'))
      })

      it('no projection provided', () => {
        delete options.projection
        expect(() => {
          createEntityStore(options)
        }).toThrow(new Error('entity-store create: projection required'))
      })

      it('invalid projection provided', () => {
        delete options.projection.registerHandlers
        expect(() => {
          createEntityStore(options)
        }).toThrow(new Error('entity-store create: projection required'))
      })

      it('no message store provided', () => {
        delete options.messageStore
        expect(() => {
          createEntityStore(options)
        }).toThrow(new Error('entity-store create: messageStore required'))
      })

      it('store without read method', () => {
        delete options.messageStore.read
        expect(() => {
          createEntityStore(options)
        }).toThrow(new Error('entity-store create: messageStore missing read'))
      })
    })
  })
})
