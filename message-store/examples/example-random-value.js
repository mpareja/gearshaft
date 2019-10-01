const crypto = require('crypto')
const exampleRandomValue = (size = 16) => {
  return crypto.randomBytes(size).toString('hex')
}

module.exports = { exampleRandomValue }
