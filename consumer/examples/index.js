module.exports = {
  ...require('../../message-store/examples'),
  ...require('./example-consumer'),
  ...require('./example-consumer-id'),
  ...require('./example-handler'),
  ...require('./example-position-store')
}
