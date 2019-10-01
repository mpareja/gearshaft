const { ExpectedVersionError } = require('../message-store')

module.exports = {
  ...require('./examples'),
  ...require('./follow'),
  ...require('./message-transforms'),
  ...require('./write'),
  ...require('./write/substitute'),
  createEventRegistry: require('./event-registry'),
  ExpectedVersionError
}
