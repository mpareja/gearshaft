module.exports = {
  ...require('./examples'),
  ...require('./follow'),
  ...require('./message-transforms'),
  ...require('./stream-name'),
  ...require('./write'),
  createEventRegistry: require('./event-registry')
}
