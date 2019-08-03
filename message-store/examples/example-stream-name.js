const StreamName = require('../stream-name.js')
const { exampleCategory, exampleRandomValue } = require('../../messaging/examples')

const exampleStreamName = (category, id, extra) => {
  if (typeof id === 'object') {
    extra = id
    id = null
  }

  if (id === 'none') {
    id = null
  } else if (!id) {
    id = exampleRandomValue()
  }

  return StreamName.create(exampleCategory(category, extra), id, extra)
}

module.exports = { exampleStreamName }
