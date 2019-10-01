const { StreamName } = require('../stream-name.js')
const { exampleCategory } = require('./example-category')
const { exampleRandomValue } = require('./example-random-value')

const exampleStreamName = (category, id, extra) => {
  if (typeof id === 'object') {
    extra = id
    id = null
  }

  if (!id) {
    id = exampleRandomValue()
  }

  return StreamName.create(exampleCategory(category, extra), id, extra)
}

module.exports = { exampleStreamName }
