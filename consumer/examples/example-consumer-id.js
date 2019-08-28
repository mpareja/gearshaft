const { exampleRandomValue } = require('../../messaging/examples')

exports.exampleConsumerId = () => {
  return `ExampleConsumer${exampleRandomValue()}`
}
