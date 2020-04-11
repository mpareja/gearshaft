const createLog = require('../../test/test-log')
const { exampleCategory, examplePut, exampleStreamName } = require('../examples')

exports.generateGetLastSuite = ({
  createMessageStore
}) => {
  describe('get-last', () => {
    let log, messageStore
    beforeEach(() => {
      log = createLog()
      messageStore = createMessageStore({ log })
    })

    describe('stream with multiple messages', () => {
      it('returns last message', async () => {
        const { streamName, messages } = await examplePut(messageStore, { count: 2 })
        const writeMessage = messages[1]

        const lastMessage = await messageStore.getLast(streamName)

        expect(lastMessage.data).toEqual(writeMessage.data)
      })

      it('logs success', async () => {
        const { streamName } = await examplePut(messageStore, { count: 2 })

        await messageStore.getLast(streamName)

        expect(log.info).toHaveBeenCalledWith({
          count: 1,
          position: 1,
          streamName
        }, 'message-store getLast: successful')
      })
    })

    describe('stream with no messages', () => {
      let lastMessage, streamName
      beforeEach(async () => {
        streamName = exampleStreamName()
        lastMessage = await messageStore.getLast(streamName)
      })

      it('returns null', async () => {
        expect(lastMessage).toBeNull()
      })

      it('logs success', async () => {
        expect(log.info).toHaveBeenCalledWith({
          count: 0,
          streamName
        }, 'message-store getLast: successful')
      })
    })

    describe('category with multiple streams', () => {
      it('retrieves last message from specified stream', async () => {
        const category = exampleCategory()

        // first stream in category
        const { streamName, messages } = await examplePut(messageStore, { category, count: 2 })
        const expectedLastMessage = messages[messages.length - 1]

        // second stream in category
        await examplePut(messageStore, { category, count: 1 })

        const lastMessage = await messageStore.getLast(streamName)

        expect(lastMessage.data).toEqual(expectedLastMessage.data)
      })
    })

    describe('when called without await', () => {
      it('does not operate during the same tick of the event loop', () => {
        const streamName = exampleStreamName()

        messageStore.getLast(streamName)

        expect(log.info).not.toHaveBeenCalled()
      })
    })
  })
}
