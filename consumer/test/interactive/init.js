const { createMessageStore } = require('../../../message-store/postgres')

const level = process.env.LOG_LEVEL || 'warn'
const log = require('pino')({ level })

exports.log = log

exports.initializeStore = () => {
  const postgresTestConfig = require('../../../message-store/postgres/test/config')().db

  const messageStore = createMessageStore({ ...postgresTestConfig, log })

  return messageStore
}
