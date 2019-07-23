const crypto = require('crypto')
const StreamName = require('../stream-name.js')

const exampleStreamName = (category, id, extra) => {
  if (typeof id === 'object') {
    extra = id
    id = null
  }
  return StreamName.create(exampleCategory(category, extra), id, extra)
}
const exampleCategory = (category, { randomize } = {}) => {
  const randomizeSpecified = typeof randomize === 'boolean'
  if (!randomizeSpecified) {
    randomize = !category
  }

  category = category || 'test'

  if (randomize) {
    category += `${crypto.randomBytes(16).toString('hex')}XX`
  }

  return category
}

module.exports = { exampleStreamName, exampleCategory }
