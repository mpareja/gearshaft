const rc = require('rc')

exports.getConfig = () => rc('gearshaft_tests', {
  db: {
    type: 'postgres',
    host: 'localhost',
    user: 'message_store',
    password: 'NInAN5t3kJo8d7I3',
    database: 'message_store'
  }
})
