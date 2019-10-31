const { exampleRandomValue } = require('../../messaging')

exports.exampleConsumerId = () => {
  return `ExampleConsumer${exampleRandomValue()}`
}
