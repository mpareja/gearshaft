const { exampleRandomValue } = require('./example-random-value')
const { Metadata } = require('../metadata')

// the `metadata` found on an instance of a user's message class
module.exports.exampleMessageMetadata = () => {
  const metadata = new Metadata()
  metadata.someMetaAttribute = exampleRandomValue()

  metadata.streamName = exampleRandomValue()
  metadata.position = 1
  metadata.globalPosition = 150

  metadata.causationMessageStreamName = exampleRandomValue()
  metadata.causationMessagePosition = 2
  metadata.causationMessageGlobalPosition = 123

  metadata.correlationStreamName = exampleRandomValue()
  metadata.replyStreamName = exampleRandomValue()

  return metadata
}
