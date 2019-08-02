const createMessageStore = require('../index')
const {
  exampleMessageData
} = require('../../examples')

describe('message-store-memory', () => {
  describe('reading stream that does not exist', () => {
    it('returns no messages', async () => {
      const store = createMessageStore()
      const found = []

      for await (const message of store.read('stream-123')) {
        found.push(message)
      }

      expect(found).toHaveLength(0)
    })
  })

  describe('write messages to stream', () => {
    let store, message1, message2
    beforeEach(() => {
      message1 = exampleMessageData()
      message2 = exampleMessageData()
      store = createMessageStore()
      store.write(message1, 'stream-123')
      store.write(message2, 'stream-123')
    })

    describe('reading messages from stream', () => {
      it('returns expected messages', async () => {
        const found = []
        for await (const message of store.read('stream-123')) {
          found.push(message)
        }
        expect(found).toEqual([message1, message2])
      })
    })

    describe('reading messages from stream position', () => {
      it('returns expected subset of messages', async () => {
        const found = []
        for await (const message of store.read('stream-123', 1)) {
          found.push(message)
        }
        expect(found).toEqual([message2])
      })
    })

    describe('reading messages from other stream', () => {
      it('returns no messages', async () => {
        const found = []
        for await (const message of store.read('stream-666')) {
          found.push(message)
        }
        expect(found).toHaveLength(0)
      })
    })
  })
})
