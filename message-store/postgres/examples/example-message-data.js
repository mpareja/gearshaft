const { uuid } = require('../../../identifier')
const { exampleRandomValue } = require('./example-random-value')

const exampleWriteMessageData = ({ id, type, data, metadata } = {}) => {
  id = id || uuid()
  type = type || 'SomeType'
  data = data || { someAttribute: exampleRandomValue() }
  metadata = metadata || exampleMetadata()
  return { id, type, data, metadata }
}

const exampleMetadata = () => {
  return { someMetaAttribute: exampleRandomValue() }
}

module.exports = { exampleWriteMessageData }
