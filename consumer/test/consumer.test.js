const createLog = require('../../test/test-log')
const {
  exampleConsumer,
  exampleHandler,
  exampleMessageClass,
  exampleReadMessageData,
  exampleStreamName
} = require('../examples')

const HandledMessageClass = exampleMessageClass('HandledMessageClass')

describe('consumer', () => {
  describe('dispatch', () => {
    describe('given a handled message', () => {
      const setupConsumerWithHandler = (opts = {}) => {
        const streamName = exampleStreamName()
        const handler = exampleHandler()
        const messageData = exampleReadMessageData(HandledMessageClass)
        const registerHandlers = (register) => {
          register(HandledMessageClass, handler)
        }
        const consumer = exampleConsumer({ registerHandlers, streamName, ...opts })
        return { consumer, handler, messageData, streamName }
      }

      it('invokes the handler', async () => {
        const { consumer, handler, messageData } = setupConsumerWithHandler()

        await consumer.dispatch(messageData)

        expect(handler.calls).toHaveLength(1)
        expect(handler.calls[0]).toBeInstanceOf(HandledMessageClass)
        expect(handler.calls[0]).toMatchObject(messageData.data)
      })

      it('logs success', async () => {
        const log = createLog()
        const name = 'MyThing'
        const { consumer, messageData, streamName } = setupConsumerWithHandler({ name, log })

        await consumer.dispatch(messageData)

        expect(log.info).toHaveBeenCalledWith({
          streamName,
          position: messageData.position,
          globalPosition: messageData.globalPosition,
          type: messageData.type
        }, 'MyThing consumer: HandledMessageClass message dispatched to handlers')
      })
    })

    describe('strict mode', () => {
      describe('given an unhandled message', () => {
        it('raises an error', async () => {
          const consumer = exampleConsumer({ strict: true })
          const promise = consumer.dispatch(exampleReadMessageData())
          await expect(promise).rejects.toBeDefined()
        })
      })
    })

    describe('un-strict mode', () => {
      describe('given an unhandled message', () => {
        it('no error is raise', async () => {
          const consumer = exampleConsumer()
          await consumer.dispatch(exampleReadMessageData())
        })
      })
    })
  })

  /*
  it('asdfasdf', () => {
    const options = {
      store,
      streamName,
      registerHandlers,
      onError: (err, messageData) => {}
    }
    const consumer = createConsumer(options)
    expect(consuemr).toBeDefined()
  })
  */
})
