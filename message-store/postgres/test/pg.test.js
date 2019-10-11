const {
  createStore, createLog, createMessageStoreDb,
  examplePut, exampleStreamName
} = require('./init-message-store')

let db
beforeAll(() => { db = createMessageStoreDb() })
afterAll(async () => { await db.close() })

let log
beforeEach(() => {
  log = createLog()
})

describe('pg', () => {
  describe('transaction', () => {
    describe('writing two messages in the same transaction', () => {
      it('both messages are stored', async () => {
        const streamName = exampleStreamName()

        await db.transaction(async (transaction) => {
          const transactionStore = createStore({ db: transaction, log })
          await examplePut(transactionStore, { streamName })
          await examplePut(transactionStore, { streamName })
        })

        const messageStore = createStore({ db, log })
        const results = await messageStore.get(streamName)

        expect(results).toHaveLength(2)
      })
    })

    describe('error during transaction after writing message', () => {
      let streamName, promise
      beforeAll(() => {
        streamName = exampleStreamName()

        promise = db.transaction(async (transaction) => {
          const transactionStore = createStore({ db: transaction, log })
          await examplePut(transactionStore, { streamName })
          throw new Error('bogus transaction error')
        })
      })

      it('message is not written (roll back)', async () => {
        await expect(promise).rejects.toBeDefined()

        const messageStore = createStore({ db, log })
        const results = await messageStore.get(streamName)

        expect(results).toHaveLength(0)
      })

      it('propagates the error from the transaction', async () => {
        await expect(promise).rejects.toEqual(new Error('bogus transaction error'))
      })
    })

    describe('concurrently writing to two different streams', () => {
      it('messages are written to both streams', async () => {
        const streamName1 = exampleStreamName()
        const streamName2 = exampleStreamName()

        await db.transaction(async (tx1) => {
          const store1 = createStore({ db: tx1, log })
          await examplePut(store1, { streamName: streamName1 })

          await db.transaction(async (tx2) => {
            const store2 = createStore({ db: tx2, log })
            await examplePut(store1, { streamName: streamName1 })
            await examplePut(store2, { streamName: streamName2 })
          })

          await examplePut(store1, { streamName: streamName1 })
        })

        const messageStore = createStore({ db, log })
        const results1 = await messageStore.get(streamName1)
        const results2 = await messageStore.get(streamName2)

        expect(results1).toHaveLength(3)
        expect(results2).toHaveLength(1)
      })
    })

    describe('concurrently writing to the same stream', () => {
      it('results in blocking until 1st transaction completes', async () => {
        const streamName = exampleStreamName()
        const states = []
        let resolveBlock
        const block = new Promise(resolve => { resolveBlock = resolve })

        let promise2
        const promise1 = db.transaction(async (tx1) => {
          const store1 = createStore({ db: tx1, log })
          await examplePut(store1, { streamName })

          promise2 = db.transaction(async (tx2) => {
            const store2 = createStore({ db: tx2, log })
            await examplePut(store2)
            states.push('before write')
            await examplePut(store2, { streamName })
            states.push('blocked stream written')
          })

          states.push('before block')
          await block
          states.push('after block')
        })

        const delay = require('util').promisify(setTimeout)
        states.push('before delay')
        await delay(50)
        states.push('after delay')

        // show that a write ought to have finished
        const messageStore = createStore({ db, log })
        await examplePut(messageStore)
        states.push('unblocked stream written')

        resolveBlock()
        await promise1
        await promise2

        expect(states).toEqual([
          'before delay',
          'before block',
          'before write',
          'after delay',
          'unblocked stream written',
          'after block',
          'blocked stream written'
        ])

        const results = await messageStore.get(streamName)
        expect(results).toHaveLength(2)
      })
    })
  })
})
