const { exampleWriteMessageData } = require('../examples')
const uuidValidate = require('uuid-validate')

describe('write-message-data', () => {
  describe('examples', () => {
    describe('no inputs', () => {
      const message = exampleWriteMessageData()

      it('generates id', () => {
        expect(uuidValidate(message.id)).toBe(true)
      })

      it('generates type', () => {
        expect(message).toEqual({
          id: expect.anything(), // covered aboe
          type: 'SomeType',
          data: {
            someAttribute: expect.stringMatching(/^[0-9a-f]{32}$/)
          },
          metadata: {
            streamName: expect.stringMatching(/^[0-9a-f]{32}$/),
            position: expect.any(Number),
            globalPosition: expect.any(Number),
            causationMessageGlobalPosition: expect.any(Number),
            causationMessageStreamName: expect.stringMatching(/^[0-9a-f]{32}$/),
            causationMessagePosition: expect.any(Number),
            correlationStreamName: expect.stringMatching(/^[0-9a-f]{32}$/),
            replyStreamName: expect.stringMatching(/^[0-9a-f]{32}$/),
            someMetaAttribute: expect.stringMatching(/^[0-9a-f]{32}$/)
          }
        })
      })
    })

    describe('specified inputs', () => {
      it('generates a message with the specified values', () => {
        const values = {
          id: '57b730bf-0a30-4ec0-89aa-888b5f22ce6d',
          type: 'OtherType',
          data: { otherAttribute: 'other-value' },
          metadata: { otherMetaAttribute: 'meta-attribute' }
        }
        const message = exampleWriteMessageData(values)
        expect(message).toEqual(values)
      })
    })
  })
})
