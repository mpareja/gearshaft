const { computeStats, writeStatsFile } = require('../../../benchmark')
const { exampleStreamName, exampleWriteMessageData } = require('../../')

const cycles = process.env.CYCLES || 100000
const warmup = 10

exports.benchmark = async (createMessageStore, benchmarkSource) => {
  const messageStore = createMessageStore()

  const entries = []
  for (let i = 0; i < cycles + warmup; i++) {
    const messageData = exampleWriteMessageData()
    const streamName = exampleStreamName()

    entries.push({ messageData, streamName })
  }

  console.log(`done preparing ${cycles} messages`)

  const { start, end } = await write(messageStore, entries)

  const stats = await computeStats(cycles, start, end)

  console.log('Statistics:', stats)

  await writeStatsFile(benchmarkSource, stats)
}

async function write (messageStore, entries) {
  // warmup
  for (const { messageData, streamName } of entries.slice(0, warmup)) {
    await messageStore.write(messageData, streamName)
  }

  const start = process.hrtime.bigint()

  for (const { messageData, streamName } of entries.slice(warmup)) {
    await messageStore.write(messageData, streamName)
  }

  const end = process.hrtime.bigint()

  return { start, end }
}
