const { exampleMessage } = require('./example-message')
const { toWriteMessageData } = require('../message-transforms')

module.exports.exampleMessageData = (...args) => {
  const message = exampleMessage(...args)
  return toWriteMessageData(message)
}
