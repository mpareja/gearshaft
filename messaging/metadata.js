class Metadata {
  follow (source) {
    this.causationMessageStreamName = source.streamName
    this.causationMessagePosition = source.position
    this.causationMessageGlobalPosition = source.globalPosition
    this.correlationStreamName = source.correlationStreamName
    this.replyStreamName = source.replyStreamName
  }
}

module.exports.Metadata = Metadata
