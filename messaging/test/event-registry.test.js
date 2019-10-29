const { createEventRegistry, exampleMessageClass } = require('../')

describe('event-registry', () => {
  describe('no message classes registered', () => {
    it('returns no handler', () => {
      const registry = createEventRegistry()

      const found = registry.get(exampleMessageClass().name)

      expect(found.handler).toBeUndefined()
    })
  })

  describe('single message class registered', () => {
    const registry = createEventRegistry()
    const Class = exampleMessageClass()
    const handler = () => {}
    registry.register(Class, handler)

    it('returns the handler', () => {
      const found = registry.get(Class.name)

      expect(found.handler).toBe(handler)
    })

    it('returns the message class', () => {
      const found = registry.get(Class.name)

      expect(found.messageClass).toBe(Class)
    })

    describe('getting unregistered class', () => {
      it('returns no handler', () => {
        const otherClassName = exampleMessageClass().name

        const found = registry.get(otherClassName)

        expect(found.handler).toBeUndefined()
      })
    })
  })

  describe('multiple message classes regsitered', () => {
    const registry = createEventRegistry()
    const Class1 = exampleMessageClass()
    const Class2 = exampleMessageClass()
    const handler1 = () => {}
    const handler2 = () => {}
    registry.register(Class1, handler1)
    registry.register(Class2, handler2)

    it('returns first message handler', () => {
      const found = registry.get(Class1.name)

      expect(found.handler).toBe(handler1)
      expect(found.messageClass).toBe(Class1)
    })

    it('returns second message handler', () => {
      const found = registry.get(Class2.name)

      expect(found.handler).toBe(handler2)
      expect(found.messageClass).toBe(Class2)
    })

    describe('getting unregistered class', () => {
      it('returns no handler', () => {
        const otherClassName = exampleMessageClass().name

        const found = registry.get(otherClassName)

        expect(found.handler).toBeUndefined()
      })
    })
  })
})
