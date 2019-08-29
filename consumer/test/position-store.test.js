const {
  exampleConsumerId,
  examplePosition,
  examplePositionStore,
  exampleMessageStore,
  exampleStreamName
} = require('../examples')

describe('position-store', () => {
  describe('get and put', () => {
    describe('given no previously stored position', () => {
      it('no position returned', async () => {
        const positionStore = examplePositionStore()
        const position = await positionStore.get()
        expect(position).toBeNull()
      })
    })

    describe('given a previously stored position', () => {
      it('returns the stored position', async () => {
        const writePosition = examplePosition()
        const positionStore = examplePositionStore()

        await positionStore.put(writePosition)
        const readPosition = await positionStore.get()

        expect(readPosition).toEqual(writePosition)
      })
    })

    describe('different consumer ids', () => {
      it('return different positions', async () => {
        const streamName = exampleStreamName()
        const store = exampleMessageStore()

        const consumerIdA = exampleConsumerId()
        const positionStoreA = examplePositionStore({ store, streamName, consumerId: consumerIdA })
        const writePositionA = 11
        await positionStoreA.put(writePositionA)

        const consumerIdB = exampleConsumerId()
        const positionStoreB = examplePositionStore({ store, streamName, consumerId: consumerIdB })
        const writePositionB = 22
        await positionStoreB.put(writePositionB)

        const readPositionA = await positionStoreA.get()
        const readPositionB = await positionStoreB.get()

        expect(readPositionA).toEqual(writePositionA)
        expect(readPositionB).toEqual(writePositionB)
      })
    })

    describe('different stream names', () => {
      it('return different positions', async () => {
        const consumerId = exampleConsumerId()
        const store = exampleMessageStore()

        const streamNameA = exampleStreamName()
        const positionStoreA = examplePositionStore({ store, streamName: streamNameA, consumerId })
        const writePositionA = 11
        await positionStoreA.put(writePositionA)

        const streamNameB = exampleStreamName()
        const positionStoreB = examplePositionStore({ store, streamName: streamNameB, consumerId })
        const writePositionB = 22
        await positionStoreB.put(writePositionB)

        const readPositionA = await positionStoreA.get()
        const readPositionB = await positionStoreB.get()

        expect(readPositionA).toEqual(writePositionA)
        expect(readPositionB).toEqual(writePositionB)
      })
    })
  })
})
