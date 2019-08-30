const { Metadata } = require('../metadata')
const { exampleMessageMetadata } = require('../examples')

describe('metadata', () => {
  describe('follow', () => {
    const source = exampleMessageMetadata()
    const dest = new Metadata()

    expect(source.causationMessageStreamName).not.toBe(dest.causationMessageStreamName)
    expect(source.causationMessagePosition).not.toBe(dest.causationMessagePosition)
    expect(source.causationMessageGlobalPosition).not.toBe(dest.causationMessageGlobalPosition)
    expect(source.correlationStreamName).not.toBe(dest.correlationStreamName)
    expect(source.replyStreamName).not.toBe(dest.replyStreamName)

    dest.follow(source)

    it('copies causation metadata', () => {
      expect(dest).toMatchObject({
        causationMessageStreamName: source.streamName,
        causationMessagePosition: source.position,
        causationMessageGlobalPosition: source.globalPosition,
        correlationStreamName: source.correlationStreamName,
        replyStreamName: source.replyStreamName
      })
    })

    it('does not copy other metadata', () => {
      expect(dest.streamName).not.toBe(source.streamName)
      expect(dest.position).not.toBe(source.position)
      expect(dest.globalPosition).not.toBe(source.globalPosition)
    })
  })
})
