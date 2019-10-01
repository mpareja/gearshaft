const delay = require('util').promisify(setTimeout)
const { cycle } = require('./cycle')
const { exampleWriteMessageData, StreamName } = require('../../message-store')

exports.bulkWrite = async ({ category, concurrency, total, store, streams, delayMilliseconds }) => {
  let count = 0
  const go = async () => {
    for (const streamId of cycle(1, streams)) {
      count++

      const streamName = StreamName.create(category, streamId)
      const messageData = exampleWriteMessageData({ type: 'InteractiveMessage' })
      await store.put(messageData, streamName)

      if (count >= total) {
        break
      }

      if (delayMilliseconds) {
        await delay(delayMilliseconds)
      }
    }
  }

  const promises = []
  for (let i = 0; i < concurrency; i++) {
    console.log('starting concurrent writer %s', i)
    promises.push(go())
  }
  return Promise.all(promises)
}
