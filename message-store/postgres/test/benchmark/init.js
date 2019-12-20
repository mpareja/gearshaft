const { createMessageStore } = require('../../')

const level = process.env.LOG_LEVEL || 'warn'
const log = require('pino')({ level })

exports.log = log

exports.initializeStore = () => {
  const postgresTestConfig = require('../config')().db

  const messageStore = createMessageStore({ ...postgresTestConfig, log })

  return messageStore
}
