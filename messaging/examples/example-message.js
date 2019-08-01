const { exampleMetadata } = require('./example-metadata')
const { exampleRandomValue } = require('./example-random-value')
const { uuid } = require('../../identifier')

class AnExampleMessage {
}

module.exports.exampleMessage = () => {
  const message = new AnExampleMessage()
  message.id = uuid()
  message.someAttribute = exampleRandomValue()
  message.metadata = exampleMetadata()
  return message
}
