const { generateEntityStoreSuite } = require('../../entity-store/test/fetch-test-suite')
const {
  createStore, createLog, createTestPostgresGateway
} = require('../../message-store/postgres/test/init-message-store')

let postgresGateway
beforeAll(() => { postgresGateway = createTestPostgresGateway() })
afterAll(async () => { await postgresGateway.end() })

const createMessageStore = () => {
  const log = createLog()
  const messageStore = createStore({ postgresGateway, log })
  return messageStore
}

generateEntityStoreSuite({
  suiteName: 'entity-store-postgres',
  createMessageStore
})
