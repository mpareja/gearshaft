const { ExpectedVersionError } = require('../message-store/expected-version-error')

module.exports = {
  ...require('./examples'),
  ...require('./follow'),
  ...require('./message-transforms'),
  ...require('./null'),
  ...require('./write'),
  ...require('./write/substitute'),
  createEventRegistry: require('./event-registry'),
  ExpectedVersionError
}
