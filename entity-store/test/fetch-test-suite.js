const createLog = require('../../test/test-log')
const { createEntityStore } = require('../entity-store')
const { createWriter } = require('../../messaging')
const { exampleCategory, exampleStreamName, StreamName } = require('../../message-store')
const { ExampleEntityClass, ExampleEntityProjection } = require('../../entity-projection')
const { exampleMessage } = require('../../messaging')

const A_CATEGORY = exampleCategory()
const MessageClassA = ExampleEntityProjection.MessageClassA
const MessageClassB = ExampleEntityProjection.MessageClassB

module.exports.generateEntityStoreSuite = ({
  suiteName,
  createMessageStore
}) => {
  describe(suiteName, () => {
    describe('fetch', () => {
      let options, entityStore, messageStore, write

      beforeEach(() => {
        const log = createLog()
        messageStore = createMessageStore({ log })
        write = createWriter({ log, messageStore })
        options = {
          category: A_CATEGORY,
          entity: ExampleEntityClass,
          messageStore,
          projection: ExampleEntityProjection
        }
        entityStore = createEntityStore(options)
      })

      it('reads from the category stream', async () => {
        const streamName = exampleStreamName(A_CATEGORY)
        const id = StreamName.getId(streamName)
        messageStore.read = jest.fn().mockReturnValue([])

        await entityStore.fetch(id)

        expect(messageStore.read).toHaveBeenCalledWith(streamName)
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
          const streamName = exampleStreamName(A_CATEGORY)
          const id = StreamName.getId(streamName)
          await write(message, streamName)

          result = await entityStore.fetch(id)
        })

        it('a single message is applied', () => {
          expect(result.applied).toHaveLength(1)
        })

        it('message is applied to correct handler', async () => {
          expect(result.applied).toEqual([
            { method: 'methodA', id: message.id }
          ])
        })
      })

      describe('two messages in message store', () => {
        let messageA, messageB, result
        beforeEach(async () => {
          messageA = exampleMessage(MessageClassA)
          messageB = exampleMessage(MessageClassB)
          const streamName = exampleStreamName(A_CATEGORY)
          const id = StreamName.getId(streamName)
          await write([messageB, messageA], streamName)

          result = await entityStore.fetch(id)
        })

        it('both messages applied to correct handler in order', () => {
          expect(result.applied).toEqual([
            { method: 'methodB', id: messageB.id },
            { method: 'methodA', id: messageA.id }
          ])
        })
      })

      describe('two entities in message store', () => {
        let message1, message2, result1, result2
        beforeEach(async () => {
          message1 = exampleMessage(MessageClassA)
          const streamName1 = exampleStreamName(A_CATEGORY)
          const id1 = StreamName.getId(streamName1)
          await write(message1, streamName1)

          message2 = exampleMessage(MessageClassA)
          const streamName2 = exampleStreamName(A_CATEGORY)
          const id2 = StreamName.getId(streamName2)
          await write(message2, streamName2)

          result1 = await entityStore.fetch(id1)
          result2 = await entityStore.fetch(id2)
        })

        it('can be independently fetched', () => {
          expect(result1.applied).toEqual([
            { method: 'methodA', id: message1.id }
          ])
          expect(result2.applied).toEqual([
            { method: 'methodA', id: message2.id }
          ])
        })
      })

      describe('handler not registered for message', () => {
        it('ignores message', async () => {
          const message = exampleMessage()
          const streamName = exampleStreamName(A_CATEGORY)
          const id = StreamName.getId(streamName)
          await write(message, streamName)

          const result = await entityStore.fetch(id)

          expect(result.applied).toHaveLength(0)
        })
      })
    })
  })
}
