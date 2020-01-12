const { generateEntityStoreSuite } = require('../../entity-store/test/fetch-test-suite')
const {
  createStore, createLog, createTestPostgresGateway
} = require('../../message-store/postgres/test/init-message-store')

let db
beforeAll(() => { db = createTestPostgresGateway() })
afterAll(async () => { await db.end() })

const createMessageStore = () => {
  const log = createLog()
  const messageStore = createStore({ db, log })
  return messageStore
}

generateEntityStoreSuite({
  suiteName: 'entity-store-postgres',
  createMessageStore
})
