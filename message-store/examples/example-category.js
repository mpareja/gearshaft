const crypto = require('crypto')

module.exports.exampleCategory = (category, { randomize } = {}) => {
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
