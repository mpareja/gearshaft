const { createEntityProjection, ExampleEntityClass, ExampleEntityProjection } = require('../')
const { exampleMessage } = require('../../messaging')

describe('entity-projection', () => {
  it('exposes registerHandlers function', () => {
    const registerHandlers = () => {}

    const projection = createEntityProjection(registerHandlers)

    expect(projection.registerHandlers).toBe(registerHandlers)
  })

  describe('project', () => {
    describe('when called with a registered message class', () => {
      it('invokes the registered handle function', () => {
        const entity = new ExampleEntityClass()
        const message = exampleMessage(ExampleEntityProjection.MessageClassA)

        ExampleEntityProjection.project(entity, message)

        expect(entity.applied).toEqual([
          { method: 'methodA', id: message.id }
        ])
      })
    })

    describe('when called with multiple messages', () => {
      it('invokes registered handle functions in order', () => {
        const entity = new ExampleEntityClass()
        const message1 = exampleMessage(ExampleEntityProjection.MessageClassA)
        const message2 = exampleMessage(ExampleEntityProjection.MessageClassB)

        ExampleEntityProjection.project(entity, message1, message2)

        expect(entity.applied).toEqual([
          { method: 'methodA', id: message1.id },
          { method: 'methodB', id: message2.id }
        ])
      })
    })

    describe('when called with an unregistered message class', () => {
      it('ignores the message', () => {
        const entity = new ExampleEntityClass()
        const message = exampleMessage()

        ExampleEntityProjection.project(entity, message)

        expect(entity.applied).toHaveLength(0)
      })
    })
  })
})
