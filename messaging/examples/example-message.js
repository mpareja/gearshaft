const { exampleMessageClass } = require('./example-message-class')
const { exampleMetadata } = require('./example-metadata')
const { exampleRandomValue } = require('./example-random-value')
const { uuid } = require('../../identifier')

module.exports.exampleMessage = () => {
  const MessageClass = exampleMessageClass()
  const message = new MessageClass()
  message.id = uuid()
  message.someAttribute = exampleRandomValue()
  message.metadata = exampleMetadata()
  return message
}
