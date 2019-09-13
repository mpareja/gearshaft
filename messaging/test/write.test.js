const createLog = require('../../test/test-log')
const createWrite = require('../write')
const { toWriteMessageData } = require('../message-transforms')
const {
  exampleMessage,
  exampleStreamName
} = require('../../message-store/examples')

const A_POSITION = 666

describe('write', () => {
  let log, store, write
  beforeEach(() => {
    log = createLog()
    store = { write: jest.fn().mockResolvedValue(A_POSITION), isExpectedVersionError: jest.fn() }
    write = createWrite({ log, store })
  })

  describe('single message', () => {
    let message, streamName
    beforeEach(async () => {
      message = exampleMessage()
      streamName = exampleStreamName()
    })

    it('writes message to store', async () => {
      await write(message, streamName)

      const messageData = toWriteMessageData(message)
      expect(store.write).toHaveBeenCalledWith([messageData], streamName, undefined)
    })

    it('returns position', async () => {
      const result = await write(message, streamName)

      expect(result).toEqual(A_POSITION)
    })

    it('success is logged', async () => {
      await write(message, streamName)

      expect(log.info).toHaveBeenCalled()
    })

    describe('expectedVersion provided', () => {
      it('writes message to store with expected version', async () => {
        const expectedVersion = 123

        await write(message, streamName, { expectedVersion })

        const messageData = toWriteMessageData(message)
        expect(store.write).toHaveBeenCalledWith(
          [messageData], streamName, expectedVersion)
      })
    })
  })

  describe('batch of messages', () => {
    let messages
    beforeEach(async () => {
      messages = [exampleMessage(), exampleMessage()]
    })

    it('writes multiple messages to store', async () => {
      const streamName = exampleStreamName()

      await write(messages, streamName)

      const messageDataBatch = [
        toWriteMessageData(messages[0]),
        toWriteMessageData(messages[1])
      ]

      expect(store.write).toHaveBeenCalledWith(messageDataBatch, streamName, undefined)
    })
  })

  describe('invalid message', () => {
    it('is an error', async () => {
      const streamName = exampleStreamName()

      const promise = write(null, streamName)

      await expect(promise).rejects.toEqual(new Error(
        'messaging write: one or more messages were invalid'))
      await expect(promise).rejects.toMatchObject({
        inner: expect.anything()
      })
    })
  })

  describe('write.initial', () => {
    it('uses version -1', async () => {
      const streamName = exampleStreamName()
      const message = exampleMessage()
      const messageData = toWriteMessageData(message)

      await write.initial(message, streamName)

      expect(store.write).toHaveBeenCalledWith([messageData], streamName, -1)
    })
  })

  describe('isExpectedVersionError', () => {
    it('defers to store implementation', () => {
      const err = new Error('bogus')
      write.isExpectedVersionError(err)
      expect(store.isExpectedVersionError).toHaveBeenCalledWith(err)
    })
  })
})
