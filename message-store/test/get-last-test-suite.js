const createLog = require('../../test/test-log')
const {
  examplePut, exampleStreamName
} = require('../examples')

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
        const { streamName, messages } = await examplePut(store, { count: 2, trackMessages: true })
        const writeMessage = messages[1]

        const lastMessage = await store.getLast(streamName)

        expect(lastMessage.data).toEqual(writeMessage.data)
      })
    })

    describe('stream with no messages', () => {
      it('returns null', async () => {
        const streamName = exampleStreamName()

        const lastMessage = await store.getLast(streamName)

        expect(lastMessage).toBeNull()
      })
    })
  })
}
