const { exampleRandomValue } = require('./example-random-value')

module.exports.exampleMetadata = () => {
  return { someMetaAttribute: exampleRandomValue() }
}
