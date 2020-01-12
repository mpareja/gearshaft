const { createTestPostgresGateway } = require('./test-postgres-gateway')
const { uuid } = require('../../identifier')

let postgresGateway
beforeAll(() => { postgresGateway = createTestPostgresGateway() })
afterAll(async () => { await postgresGateway.end() })

const insert = async (gateway, id) => {
  const sql = 'insert into automated_tests (id) values ($1)'
  return gateway.query(sql, [id])
}

const select = async (gateway, id) => {
  const sql = 'select id from automated_tests where id = $1'
  const results = await gateway.query(sql, [id])
  return results.rows[0]
}

describe('postgres-gateway', () => {
  describe('transaction', () => {
    describe('writing two messages in the same transaction', () => {
      it('both messages are stored', async () => {
        const id1 = uuid()
        const id2 = uuid()

        await postgresGateway.transaction(async (transaction) => {
          await insert(transaction, id1)

          await insert(transaction, id2)
        })

        const found1 = await select(postgresGateway, id1)
        expect(found1.id).toBe(id1)

        const found2 = await select(postgresGateway, id2)
        expect(found2.id).toBe(id2)
      })
    })

    describe('error during transaction after writing message', () => {
      const setupErrorInTransaction = () => {
        const id = uuid()
        const error = new Error('bogus transaction error')

        const promise = postgresGateway.transaction(async (transaction) => {
          await insert(transaction, id)

          throw error
        })

        return { id, error, promise }
      }

      it('message is not written (roll back)', async () => {
        const { id, promise } = setupErrorInTransaction()

        await promise.catch(() => {})

        const found = await select(postgresGateway, id)
        expect(found).toBe(undefined)
      })

      it('propagates error', async () => {
        const { error, promise } = setupErrorInTransaction()

        const foundError = await promise.catch(err => err)

        expect(foundError).toBe(error)
      })
    })
  })
})
