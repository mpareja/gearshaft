const crypto = require('crypto')

exports.exampleRandomValue = (size = 16) => {
  return crypto.randomBytes(size).toString('hex')
}
