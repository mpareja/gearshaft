const { exampleMessage } = require('./example-message')
const { exampleMessageMetadata } = require('./example-message-metadata')
const { exampleRandomValue } = require('./example-random-value')
const { toWriteMessageData } = require('../message-transforms')
const { uuid } = require('../../identifier')

exports.exampleMessageData = (...args) => {
  const message = exampleMessage(...args)
  return toWriteMessageData(message)
}

exports.exampleWriteMessageData = ({ id, type, data, metadata } = {}) => {
  id = id || uuid()
  type = type || 'SomeType'
  data = data || { someAttribute: exampleRandomValue() }
  metadata = metadata || exampleMessageMetadata()
  return { id, type, data, metadata }
}
