const { exampleMessageStore } = require('../examples')
const { generateEntityStoreSuite } = require('./fetch-test-suite')

generateEntityStoreSuite({
  suiteName: 'entity-store-memory',
  createMessageStore: exampleMessageStore
})
