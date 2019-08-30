const { exampleMessageClass } = require('./example-message-class')
const { exampleMessageMetadata } = require('./example-message-metadata')
const { exampleRandomValue } = require('./example-random-value')
const { uuid } = require('../../identifier')

module.exports.exampleMessage = (MessageClass) => {
  MessageClass = MessageClass || exampleMessageClass()
  const message = new MessageClass()
  message.id = uuid()
  message.someAttribute = exampleRandomValue()
  message.metadata = exampleMessageMetadata()
  return message
}
