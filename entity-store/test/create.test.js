const createEntityStore = require('../entity-store')
const {
  exampleCategory
} = require('../examples')

class SomeEntityClass {}

describe('entity-store', () => {
  describe('create', () => {
    let options
    beforeEach(() => {
      options = {
        category: exampleCategory(),
        entity: SomeEntityClass,
        store: { read: () => {} },
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

      it('no store provided', () => {
        delete options.store
        expect(() => {
          createEntityStore(options)
        }).toThrow(new Error('entity-store create: message-store required'))
      })

      it('store without read method', () => {
        delete options.store.read
        expect(() => {
          createEntityStore(options)
        }).toThrow(new Error('entity-store create: message-store missing read'))
      })
    })
  })
})
