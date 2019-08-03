const { generateEntityStoreSuite } = require('../../entity-store/test/fetch-test-suite')
const {
  createStore, createLog, createMessageStoreDb
} = require('../../message-store/postgres/test/init-message-store')

let db
beforeAll(async () => { db = await createMessageStoreDb() }, 8100) // 4s create postgres + 4s to migrate
afterAll(async () => { await db.close() })

const createMessageStore = () => {
  const log = createLog()
  const store = createStore({ db, log })
  return store
}

generateEntityStoreSuite({
  suiteName: 'entity-store-postgres',
  createMessageStore
})
