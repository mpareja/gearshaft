const { uuid } = require('../../../identifier')
const {
  exampleMetadata,
  exampleRandomValue
} = require('../../../messaging/examples')

const exampleWriteMessageData = ({ id, type, data, metadata } = {}) => {
  id = id || uuid()
  type = type || 'SomeType'
  data = data || { someAttribute: exampleRandomValue() }
  metadata = metadata || exampleMetadata()
  return { id, type, data, metadata }
}

module.exports = { exampleWriteMessageData }
