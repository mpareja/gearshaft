const delay = require('util').promisify(setTimeout)
const { cycle } = require('./cycle')
const { exampleWriteMessageData, StreamName } = require('../../../messaging')
const { initializeStore } = require('./init')

const category = process.env.CATEGORY || 'testPostgresConsumer'
const concurrency = Number(process.env.CONCURRENCY || 3)
const total = Number(process.env.TOTAL || 1e6)
const streams = Number(process.env.STREAMS || 4)
const delayMilliseconds = Number(process.env.DELAY || 0)

const store = initializeStore()

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

for (let i = 0; i < concurrency; i++) {
  console.log('starting concurrent writer %s', i)
  go()
}
