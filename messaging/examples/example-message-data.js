const { exampleMessageMetadata } = require('./example-message-metadata')
const { examplePosition, exampleGlobalPosition } = require('./example-position')
const { exampleRandomValue } = require('./example-random-value')
const { exampleStreamName } = require('./example-stream-name')
const { uuid } = require('../../identifier')

exports.exampleReadMessageData = (MessageClass) => {
  const id = uuid()
  const type = (MessageClass && MessageClass.name) || 'SomeType'
  const data = { someAttribute: exampleRandomValue() }
  const metadata = exampleMessageMetadata()

  const streamName = exampleStreamName()
  const position = examplePosition()
  const globalPosition = exampleGlobalPosition()

  return { id, type, data, metadata, streamName, position, globalPosition }
}
