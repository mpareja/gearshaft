const createEntityStore = require('../entity-store')
const createLog = require('../../test/test-log')
const createWriter = require('../../messaging/write')
const {
  ExampleEntityClass,
  exampleMessage,
  exampleMessageClass,
  exampleMessageStore
} = require('../examples')

const MessageClassA = exampleMessageClass()
const MessageClassB = exampleMessageClass()

const registerHandlers = (register) => {
  register(MessageClassA, (entity, input) => {
    entity.methodA(input)
  })
  register(MessageClassB, (entity, input) => {
    entity.methodB(input)
  })
}

describe('entity-store', () => {
  describe('fetch', () => {
    let options, entityStore, messageStore, write

    beforeEach(() => {
      messageStore = exampleMessageStore()
      write = createWriter({ log: createLog(), store: messageStore })
      options = {
        category: 'pets',
        entity: ExampleEntityClass,
        messageStore,
        registerHandlers
      }
      entityStore = createEntityStore(options)
    })

    it('reads from the category stream', async () => {
      messageStore.read = jest.fn().mockReturnValue([])

      await entityStore.fetch('some-id')

      expect(messageStore.read).toHaveBeenCalledWith('pets-some-id')
    })

    describe('stream does not exist', () => {
      let result
      beforeEach(async () => {
        result = await entityStore.fetch('unknown-id')
      })

      it('returns instance of entity class', async () => {
        expect(result).toBeInstanceOf(ExampleEntityClass)
      })

      it('returns entity with no messages applied', async () => {
        expect(result.someMessagesApplied).toBe(false)
      })
    })

    describe('single message in message store', () => {
      let message, result
      beforeEach(async () => {
        message = exampleMessage(MessageClassA)
        await write(message, 'pets-123')

        result = await entityStore.fetch('123')
      })

      it('a single message is applied', () => {
        expect(result.applied).toHaveLength(1)
      })

      it('message is applied to correct handler', async () => {
        expect(result.applied).toEqual([
          { method: 'methodA', message }
        ])
      })
    })

    describe('two messages in message store', () => {
      let messageA, messageB, result
      beforeEach(async () => {
        messageA = exampleMessage(MessageClassA)
        messageB = exampleMessage(MessageClassB)
        await write([messageB, messageA], 'pets-555')

        result = await entityStore.fetch('555')
      })

      it('both messages applied to correct handler in order', () => {
        expect(result.applied).toEqual([
          { method: 'methodB', message: messageB },
          { method: 'methodA', message: messageA }
        ])
      })
    })

    describe('handler not registered for message', () => {
    })
  })
})
