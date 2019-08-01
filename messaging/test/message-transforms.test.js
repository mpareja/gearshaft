const { toWriteMessageData } = require('../message-transforms')
const {
  exampleMessage
} = require('../examples')

describe('message-transforms', () => {
  describe('toWriteMessageData', () => {
    let message, messageData

    beforeAll(() => {
      message = exampleMessage()
      messageData = toWriteMessageData(message)
    })

    it('includes id', () => {
      expect(messageData.id).toBe(message.id)
    })

    it('includes type', () => {
      expect(messageData.type).toBe('AnExampleMessage')
    })

    it('includes message fields', () => {
      expect(messageData.data.someAttribute).toBe(message.someAttribute)
    })

    it('includes message metadata', () => {
      expect(messageData.metadata.someMetaAttribute)
        .toEqual(message.metadata.someMetaAttribute)
    })

    it('message field does not contain id', () => {
      expect(messageData.data.id).toBeUndefined()
    })

    it('message field does not contain metadata', () => {
      expect(messageData.data.metadata).toBeUndefined()
    })

    describe('metadata field with a null value', () => {
      const message = exampleMessage()
      message.metadata.other = null
      const messageData = toWriteMessageData(message)

      it('is not included in messageData.metadata', () => {
        expect(messageData.metadata.other).toBeUndefined()
      })

      it('is left intact in original message', () => {
        expect(message.metadata.other).toBeNull()
      })
    })
  })
})
