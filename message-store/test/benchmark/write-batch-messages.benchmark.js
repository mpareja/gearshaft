const { computeStats, writeStatsFile } = require('../../../benchmark')
const { exampleStreamName, exampleWriteMessageData } = require('../../')

const cycles = process.env.CYCLES || 100
const batchSize = process.env.BATCH_SIZE || 1000
const warmup = 2

exports.benchmark = async (createMessageStore, benchmarkSource) => {
  console.log('Parameters:')
  console.log(`  CYCLES: ${cycles}`)
  console.log(`  BATCH_SIZE: ${batchSize}`)
  console.log()

  const { messageStore, teardown } = createMessageStore()

  const batches = generateBatches(cycles, batchSize, warmup)

  console.log(`done preparing ${cycles} batches of ${batchSize} messages`)

  const { start, end } = await write(messageStore, batches)

  const stats = await computeStats(cycles, start, end)

  console.log('Statistics:', stats)

  await writeStatsFile(benchmarkSource, stats)

  await teardown()
}

function generateBatches (cycles, batchSize, warmup) {
  const batches = []

  for (let i = 0; i < cycles + warmup; i++) {
    const streamName = exampleStreamName()
    const messages = []
    batches.push({ streamName, messages })

    for (let j = 0; j < batchSize; j++) {
      const messageData = exampleWriteMessageData()

      messages.push(messageData)
    }
  }

  return batches
}

async function write (messageStore, batches) {
  // warmup
  for (const { messages, streamName } of batches.slice(0, warmup)) {
    await messageStore.write(messages, streamName)
  }

  const start = process.hrtime.bigint()

  for (const { messages, streamName } of batches.slice(warmup)) {
    await messageStore.write(messages, streamName)
  }

  const end = process.hrtime.bigint()

  return { start, end }
}
