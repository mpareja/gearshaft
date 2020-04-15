const { bulkWrite } = require('../../../message-store/test/bulk-write')
const { computeStats, writeStatsFile } = require('../../../benchmark')
const { createConsumer } = require('../../../consumer')
const { exampleCategory } = require('../../../message-store')
const { initializeStore, log } = require('../interactive/init')
const { InteractiveMessage } = require('../interactive/messages')

const category = process.env.CATEGORY || exampleCategory('NoOpConsumerBenchmark', { randomize: true })
const total = process.env.CYCLES || 1e3

benchmark()

async function benchmark () {
  console.log('Parameters:')
  console.log(`  CYCLES: ${total}`)
  console.log(`  CATEGORY: ${category}`)
  console.log()

  const messageStore = initializeStore()
  await bulkWrite({ category, concurrency: 3, total, messageStore, streams: 3 })

  console.log('done writing messages')
  console.log('starting consumer')

  const { count, startTime, lastProcessedTime } = await consume(messageStore, category, total)

  const stats = await computeStats(count, startTime, lastProcessedTime)

  console.log('Statistics:', stats)

  await writeStatsFile(__filename, stats)
}

async function consume (messageStore, category, total) {
  let count = 0
  let lastProcessedTime
  let done
  const signal = new Promise((resolve) => { done = resolve })

  const registerHandlers = (register) => {
    register(InteractiveMessage, (message) => {
      count++
      lastProcessedTime = process.hrtime.bigint()

      if (count >= total) {
        done()
      }
    })
  }

  const consumer = createConsumer({ category, log, name: 'interactive', registerHandlers, messageStore })

  const startTime = process.hrtime.bigint()
  const runner = consumer.start()

  await signal
  await runner.stop()

  return { count, startTime, lastProcessedTime }
}
