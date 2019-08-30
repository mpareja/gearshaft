const createLog = require('../../test/test-log')
const { createConsumerHandlerRegistry } = require('../consumer-handler-registry')
const { exampleMessageData } = require('../examples')

class UnhandledMessageClass {}
class HandledMessageClass {}

const setup = ({ strict } = {}) => {
  const log = createLog()
  const handler = jest.fn()
  const registry = createConsumerHandlerRegistry({
    name: 'MyConsumer',
    log,
    strict
  })
  registry.register(HandledMessageClass, handler)

  return { handler, log, registry }
}

describe('consumer-handler-registry', () => {
  describe('handle', () => {
    describe('handler found for message', () => {
      const setupHandlerFound = async () => {
        const vars = setup()
        const messageData = exampleMessageData(HandledMessageClass)

        await vars.registry.handle(messageData)

        return { ...vars, messageData }
      }

      it('calls the handler function with the message instance', async () => {
        const { handler, messageData } = await setupHandlerFound()

        expect(handler).toHaveBeenCalled()
        const callMessage = handler.mock.calls[0][0]
        expect(callMessage).toBeInstanceOf(HandledMessageClass)
        expect(callMessage).toMatchObject(messageData.data)
      })

      it('logs handling of the message', async () => {
        const { log, messageData } = await setupHandlerFound()

        expect(log.info).toHaveBeenCalledWith({
          consumerName: 'MyConsumer',
          messageId: messageData.id,
          messageType: 'HandledMessageClass'
        }, 'MyConsumer consumer: handled HandledMessageClass message')
      })
    })

    describe('unable to find handler for message', () => {
      describe('not-strict consumer', () => {
        it('ignores the message', async () => {
          const { registry } = setup()
          const messageData = exampleMessageData(UnhandledMessageClass)

          await registry.handle(messageData)
        })

        it('logs handling of the message', async () => {
          const { log, registry } = setup()
          const messageData = exampleMessageData(UnhandledMessageClass)

          await registry.handle(messageData)

          expect(log.info).toHaveBeenCalledWith({
            consumerName: 'MyConsumer',
            messageId: messageData.id,
            messageType: 'UnhandledMessageClass'
          }, 'MyConsumer consumer: ignored UnhandledMessageClass message')
        })
      })

      describe('strict consumer', () => {
        it('raises error', async () => {
          const { registry } = setup({ strict: true })
          const messageData = exampleMessageData(UnhandledMessageClass)

          const promise = registry.handle(messageData)

          await expect(promise).rejects.toThrow(
            'MyConsumer consumer: UnhandledMessageClass handler not found for strict consumer MyConsumer')
        })
      })
    })
  })
})
