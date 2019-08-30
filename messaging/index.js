module.exports = {
  ...require('./follow'),
  ...require('./message-transforms'),
  ...require('./stream-name'),
  createEventRegistry: require('./event-registry'),
  createWriter: require('./write')
}
