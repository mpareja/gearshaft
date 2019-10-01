const createLog = require('../../test/test-log')
const { examplePut, exampleStreamName } = require('../examples')

exports.generateGetLastSuite = ({
  createMessageStore
}) => {
  describe('get-last', () => {
    let log, store
    beforeEach(() => {
      log = createLog()
      store = createMessageStore({ log })
    })

    describe('stream with multiple messages', () => {
      it('returns last message', async () => {
        const { streamName, messages } = await examplePut(store, { count: 2 })
        const writeMessage = messages[1]

        const lastMessage = await store.getLast(streamName)

        expect(lastMessage.data).toEqual(writeMessage.data)
      })

      it('logs success', async () => {
        const { streamName } = await examplePut(store, { count: 2 })

        await store.getLast(streamName)

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
        lastMessage = await store.getLast(streamName)
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
  })
}
