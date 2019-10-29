const { exampleMessageStore } = require('../../message-store')
const { generateEntityStoreSuite } = require('./fetch-test-suite')

generateEntityStoreSuite({
  suiteName: 'entity-store-memory',
  createMessageStore: exampleMessageStore
})
