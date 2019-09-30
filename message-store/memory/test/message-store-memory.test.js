const createLog = require('../../../test/test-log')
const { createMessageStore } = require('../index')
const { generateGetLastSuite } = require('../../test/get-last-test-suite')
const { generateGetSuite } = require('../../test/get-test-suite')
const { generatePutSuite } = require('../../test/put-test-suite')
const { generateReadSuite } = require('../../test/read-test-suite')
const { generateWriteSuite } = require('../../test/write-test-suite')
const {
  exampleWriteMessageData,
  exampleStreamName
} = require('../../examples')

describe('message-store-memory', () => {
  generateGetLastSuite({ createMessageStore })
  generateGetSuite({ createMessageStore })
  generatePutSuite({ createMessageStore })
  generateReadSuite({ createMessageStore })
  generateWriteSuite({ createMessageStore })

  let store, log
  beforeEach(() => {
    log = createLog()
    store = createMessageStore({ log })
  })

  const read = (...args) => {
    return readFrom(store, ...args)
  }

  const readFrom = async (aStore, streamName, position) => {
    const found = []
    for await (const message of aStore.read(streamName, position)) {
      found.push(message)
    }
    return found
  }

  describe('positions', () => {
    describe('within a stream', () => {
      let found
      beforeEach(async () => {
        const streamName = exampleStreamName()
        await store.write([exampleWriteMessageData(), exampleWriteMessageData()], streamName)

        found = await read(streamName)
      })

      it('position increases', () => {
        expect(found.map(m => m.position)).toEqual([0, 1])
      })

      it('globalPosition increases', () => {
        expect(found.map(m => m.globalPosition)).toEqual([0, 1])
      })
    })

    describe('across streams', () => {
      let found
      beforeEach(async () => {
        const streamName1 = exampleStreamName()
        await store.write([exampleWriteMessageData(), exampleWriteMessageData()],
          streamName1)

        const streamName2 = exampleStreamName()
        await store.write([exampleWriteMessageData(), exampleWriteMessageData()],
          streamName2)

        found = await read(streamName2)
      })

      it('position resets', () => {
        expect(found.map(m => m.position)).toEqual([0, 1])
      })

      it('globalPosition increases', () => {
        expect(found.map(m => m.globalPosition)).toEqual([2, 3])
      })
    })
  })

  describe('duplicate message id', () => {
    it('is an error', async () => {
      const streamName = exampleStreamName()
      const message = exampleWriteMessageData()
      await store.write(message, streamName)

      await expect(store.write(message, streamName)).rejects.toEqual(new Error(
        `message-store write: duplicate message id: ${message.id}`))
    })
  })

  describe('dependencies', () => {
    describe('given no options', () => {
      it('uses null log', async () => {
        const store = createMessageStore()

        await store.get(exampleStreamName())
      })
    })

    describe('given options without log', () => {
      it('uses null log', async () => {
        const store = createMessageStore({})

        await store.get(exampleStreamName())
      })
    })
  })
})
