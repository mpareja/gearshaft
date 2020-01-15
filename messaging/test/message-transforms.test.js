const { fromReadMessageData, toWriteMessageData } = require('../message-transforms')
const {
  exampleMessage,
  exampleMessageClass
} = require('../examples')

describe('message-transforms', () => {
  describe('toWriteMessageData', () => {
    let message, messageData

    beforeEach(() => {
      message = exampleMessage()
      messageData = toWriteMessageData(message)
    })

    it('includes id', () => {
      expect(messageData.id).toBe(message.id)
    })

    it('includes type', () => {
      expect(messageData.type).toMatch(/^AnExampleMessage_/)
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

    describe('message without metadata', () => {
      it('includes empty metadata', () => {
        const message = exampleMessage()
        delete message.metadata

        const messageData = toWriteMessageData(message)

        expect(messageData.metadata).toEqual({})
      })
    })

    describe('null message', () => {
      it('is an error', () => {
        expect(() => toWriteMessageData(null)).toThrow(
          'toWriteMessageData: message must be defined')
      })
    })
  })

  describe('fromReadMessageData', () => {
    let message, messageClass, messageData, transformed

    beforeEach(() => {
      messageClass = exampleMessageClass()
      message = exampleMessage(messageClass)
      messageData = toWriteMessageData(message)
      messageData.streamName = 'someStream'
      messageData.position = 1
      messageData.globalPosition = 123
      messageData.time = new Date()
      transformed = fromReadMessageData(messageData, messageClass)
    })

    it('includes id', () => {
      expect(transformed.id).toBe(message.id)
    })

    it('message is instance of message class', () => {
      expect(transformed).toBeInstanceOf(messageClass)
    })

    it('includes message fields', () => {
      expect(transformed.someAttribute).toBe(messageData.data.someAttribute)
    })

    describe('metadata', () => {
      it('includes message metadata', () => {
        expect(transformed.metadata.someMetaAttribute)
          .toEqual(messageData.metadata.someMetaAttribute)
      })

      it('includes stream name', () => {
        expect(transformed.metadata.streamName).toBe(messageData.streamName)
      })

      it('includes position', () => {
        expect(transformed.metadata.position).toBe(messageData.position)
      })

      it('includes global position', () => {
        expect(transformed.metadata.globalPosition).toBe(messageData.globalPosition)
      })

      it('includes time', () => {
        expect(transformed.metadata.time).toBe(messageData.time)
      })

      describe('MessageData without metadata', () => {
        it('includes standard metadata', () => {
          delete messageData.metadata

          const transformed = fromReadMessageData(messageData, messageClass)

          expect(transformed.metadata).toBeInstanceOf(Object)
          expect(transformed.metadata.position).toBe(messageData.position)
        })
      })
    })

    describe('null message', () => {
      it('is an error', () => {
        expect(() => fromReadMessageData(null)).toThrow(
          'fromReadMessageData: messageData must be defined')
      })
    })
  })
})
