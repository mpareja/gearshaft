const { exampleConsumerId, examplePositionStore } = require('../examples')
const { exampleMessageStore, examplePosition, exampleStreamName } = require('../../message-store')

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
        const messageStore = exampleMessageStore()

        const consumerIdA = exampleConsumerId()
        const positionStoreA = examplePositionStore({ messageStore, streamName, consumerId: consumerIdA })
        const writePositionA = 11
        await positionStoreA.put(writePositionA)

        const consumerIdB = exampleConsumerId()
        const positionStoreB = examplePositionStore({ messageStore, streamName, consumerId: consumerIdB })
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
        const messageStore = exampleMessageStore()

        const streamNameA = exampleStreamName()
        const positionStoreA = examplePositionStore({ messageStore, streamName: streamNameA, consumerId })
        const writePositionA = 11
        await positionStoreA.put(writePositionA)

        const streamNameB = exampleStreamName()
        const positionStoreB = examplePositionStore({ messageStore, streamName: streamNameB, consumerId })
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
