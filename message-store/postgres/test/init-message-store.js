const createLog = require('../../../test/test-log')
const { createMessageStore } = require('../')
const { createTestPostgresGateway } = require('../../../postgres-gateway/test/test-postgres-gateway')

module.exports = {
  ...require('../../examples'),
  createStore: createMessageStore,
  createLog,
  createTestPostgresGateway
}
