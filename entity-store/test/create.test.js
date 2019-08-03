const createEntityStore = require('../entity-store')
const {
  exampleCategory,
  exampleMessageStore
} = require('../examples')

class SomeEntityClass {}

describe('entity-store', () => {
  describe('create', () => {
    let options
    beforeEach(() => {
      options = {
        category: exampleCategory(),
        entity: SomeEntityClass,
        messageStore: exampleMessageStore(),
        registerHandlers: jest.fn()
      }
    })

    it('returns entity store', () => {
      const store = createEntityStore(options)
      expect(store).toBeDefined()
    })

    it('calls registerHandlers with registry', () => {
      createEntityStore(options)
      expect(options.registerHandlers).toHaveBeenCalledWith(
        expect.objectContaining({ register: expect.any(Function) })
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

      it('no registerHandlers function provided', () => {
        delete options.registerHandlers
        expect(() => {
          createEntityStore(options)
        }).toThrow(new Error('entity-store create: registerHandlers required'))
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
