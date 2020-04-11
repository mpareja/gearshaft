const { createMessageStore } = require('../../')
const { createTestPostgresGateway } = require('../../../../postgres-gateway/test/test-postgres-gateway')

const level = process.env.LOG_LEVEL || 'warn'
const log = require('pino')({ level })

exports.log = log

exports.initializeStore = () => {
  const postgresGateway = createTestPostgresGateway()

  const messageStore = createMessageStore({ log, postgresGateway })

  const teardown = () => postgresGateway.end()

  return { messageStore, teardown }
}
