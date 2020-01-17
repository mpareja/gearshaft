const { exampleDocumentId } = require('./example-document-id')
const { exampleRandomValue } = require('./example-random-value')
const { ExampleEntityClass } = require('./example-entity-class')

exports.exampleDocument = (overrides) => {
  return Object.assign(new ExampleEntityClass(), {
    basketId: exampleDocumentId(),
    someValue: exampleRandomValue()
  }, overrides)
}
