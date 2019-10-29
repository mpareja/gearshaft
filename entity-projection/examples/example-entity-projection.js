const { createEntityProjection } = require('../entity-projection')
const { exampleMessageClass } = require('../../messaging')

const MessageClassA = exampleMessageClass()
const MessageClassB = exampleMessageClass()

exports.ExampleEntityProjection = createEntityProjection((register) => {
  register(MessageClassA, (entity, input) => {
    entity.methodA(input)
  })
  register(MessageClassB, (entity, input) => {
    entity.methodB(input)
  })
})

exports.ExampleEntityProjection.MessageClassA = MessageClassA
exports.ExampleEntityProjection.MessageClassB = MessageClassB
