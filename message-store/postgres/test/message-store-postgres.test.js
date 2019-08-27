const { generateGetSuite } = require('../../test/get-test-suite')
const { generateReadSuite } = require('../../test/read-test-suite')
const { generateWriteSuite } = require('../../test/write-test-suite')
const {
  createStore, createMessageStoreDb
} = require('./init-message-store')

let db
beforeAll(async () => { db = await createMessageStoreDb() }, 8100) // 4s create postgres + 4s to migrate
afterAll(async () => { await db.close() })

const createMessageStore = (options) => createStore({ db, ...options })

describe('message-store-postgres', () => {
  generateGetSuite({ createMessageStore })
  generateReadSuite({ createMessageStore })
  generateWriteSuite({ createMessageStore })
})
