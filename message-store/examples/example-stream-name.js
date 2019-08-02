const StreamName = require('../stream-name.js')
const { exampleCategory } = require('../../messaging/examples')
const { uuid } = require('../../identifier')

const exampleStreamName = (category, id, extra) => {
  if (typeof id === 'object') {
    extra = id
    id = null
  }

  if (id === 'none') {
    id = null
  } else if (!id) {
    id = uuid()
  }

  return StreamName.create(exampleCategory(category, extra), id, extra)
}

module.exports = { exampleStreamName }
