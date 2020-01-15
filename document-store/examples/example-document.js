const { exampleDocumentId } = require('./example-document-id')
const { exampleRandomValue } = require('./example-random-value')

exports.exampleDocument = (overrides) => {
  return Object.assign({
    basketId: exampleDocumentId(),
    someValue: exampleRandomValue()
  }, overrides)
}
