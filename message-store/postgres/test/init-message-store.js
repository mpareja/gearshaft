const { createMessageStore } = require('../')
const createLog = require('../../../test/test-log')
const createMessageStoreDb = require('./create-message-store-db')

module.exports = {
  ...require('../../examples'),
  createStore: createMessageStore,
  createLog,
  createMessageStoreDb
}
