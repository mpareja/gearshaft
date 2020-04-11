const { createMessageStore } = require('../../')

exports.initializeStore = () => {
  const messageStore = createMessageStore()

  return { messageStore, teardown: () => {} }
}
