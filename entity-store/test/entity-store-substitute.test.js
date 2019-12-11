const { createEntityStoreSubstitute } = require('../entity-store-substitute')
const { ExampleEntityClass } = require('../../entity-projection')
const { examplePosition } = require('../../message-store')

const AN_ENTITY_ID = '68b42624-8c15-4c86-9e68-6c04d6565258'

const setup = () => {
  const entityStore = createEntityStoreSubstitute({
    entity: ExampleEntityClass
  })
  return { entityStore }
}

describe('entity-store-substitute', () => {
  describe('fetch', () => {
    describe('stream does not exist', () => {
      it('returns instance of entity class', async () => {
        const entity = await setup().entityStore.fetch('unknown-id')

        expect(entity).toBeInstanceOf(ExampleEntityClass)
      })

      it('returns entity with no messages applied', async () => {
        const entity = await setup().entityStore.fetch('unknown-id')

        expect(entity.someMessagesApplied).toBe(false)
      })
    })

    describe('entity exists in store', () => {
      it('returns entity', async () => {
        const { entityStore } = setup()
        const added = new ExampleEntityClass()
        added.methodA('message a')
        entityStore.add(AN_ENTITY_ID, added)

        const entity = await entityStore.fetch(AN_ENTITY_ID)

        expect(entity).toBe(added)
      })
    })
  })

  describe('fetchRecord', () => {
    describe('entity exists in store', () => {
      it('returns entity with record metadata', async () => {
        const { entityStore } = setup()
        const added = new ExampleEntityClass()
        added.methodA('message a')
        const position = examplePosition()
        entityStore.add(AN_ENTITY_ID, added, position)

        const [entity, record] = await entityStore.fetchRecord(AN_ENTITY_ID)

        expect(entity).toBe(added)
        expect(record.version).toBe(position)
      })
    })

    describe('entity does not exist in store', () => {
      it('returns instance of entity class', async () => {
        const [entity] = await setup().entityStore.fetchRecord('unknown-id')

        expect(entity).toBeInstanceOf(ExampleEntityClass)
        expect(entity.someMessagesApplied).toBe(false)
      })

      it('returns no other record metadata', async () => {
        const [entity, record] = await setup().entityStore.fetchRecord('unknown-id')

        expect(entity).toBeDefined()
        expect(record.version).toBeUndefined()
      })
    })
  })
})
