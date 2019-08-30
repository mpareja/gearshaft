const { uuid } = require('../../identifier')
const {
  exampleMessageMetadata,
  exampleRandomValue
} = require('../../messaging/examples')

const exampleWriteMessageData = ({ id, type, data, metadata } = {}) => {
  id = id || uuid()
  type = type || 'SomeType'
  data = data || { someAttribute: exampleRandomValue() }
  metadata = metadata || exampleMessageMetadata()
  return { id, type, data, metadata }
}

module.exports = { exampleWriteMessageData }
