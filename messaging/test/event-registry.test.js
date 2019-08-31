const createRegistry = require('../event-registry')
const {
  exampleReadMessageData,
  exampleMessageClass
} = require('../examples')

describe('event-registry', () => {
  describe('no message classes registered', () => {
    it('returns no handler', () => {
      const registry = createRegistry()

      const found = registry.get(exampleReadMessageData())

      expect(found.handler).toBeUndefined()
    })
  })

  describe('single message class registered', () => {
    const registry = createRegistry()
    const Class = exampleMessageClass()
    const handler = () => {}
    const messageData = exampleReadMessageData(Class)
    registry.register(Class, handler)

    it('returns the handler', () => {
      const found = registry.get(messageData)

      expect(found.handler).toBe(handler)
    })

    it('returns the message class', () => {
      const found = registry.get(messageData)

      expect(found.messageClass).toBe(Class)
    })

    describe('getting unregistered class', () => {
      it('returns no handler', () => {
        const messageOfOtherClass = exampleReadMessageData()

        const found = registry.get(messageOfOtherClass)

        expect(found.handler).toBeUndefined()
      })
    })
  })

  describe('multiple message classes regsitered', () => {
    const registry = createRegistry()
    const Class1 = exampleMessageClass()
    const Class2 = exampleMessageClass()
    const handler1 = () => {}
    const handler2 = () => {}
    registry.register(Class1, handler1)
    registry.register(Class2, handler2)

    it('returns first message handler', () => {
      const messageData = exampleReadMessageData(Class1)

      const found = registry.get(messageData)

      expect(found.handler).toBe(handler1)
      expect(found.messageClass).toBe(Class1)
    })

    it('returns second message handler', () => {
      const messageData = exampleReadMessageData(Class2)

      const found = registry.get(messageData)

      expect(found.handler).toBe(handler2)
      expect(found.messageClass).toBe(Class2)
    })

    describe('getting unregistered class', () => {
      it('returns no handler', () => {
        const messageOfOtherClass = exampleReadMessageData()

        const found = registry.get(messageOfOtherClass)

        expect(found.handler).toBeUndefined()
      })
    })
  })
})
