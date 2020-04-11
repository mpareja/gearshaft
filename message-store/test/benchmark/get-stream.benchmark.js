const { computeStats, writeStatsFile } = require('../../../benchmark')
const { exampleStreamName, exampleWriteMessageData } = require('../../')

const cycles = process.env.CYCLES || 100000

exports.benchmark = async (initializeStore, scriptFile) => {
  console.log('Parameters:')
  console.log(`  CYCLES: ${cycles}`)
  const messageStore = initializeStore()

  const entries = []
  for (let i = 0; i < cycles; i++) {
    const messageData = exampleWriteMessageData()
    const streamName = exampleStreamName()

    entries.push({ messageData, streamName })

    await messageStore.put(messageData, streamName)
  }

  console.log(`done writing ${entries.length} messages`)

  const { count, start, end } = await read(messageStore, entries)

  const stats = await computeStats(count, start, end)

  console.log('Statistics:', stats)

  await writeStatsFile(scriptFile, stats)
}

async function read (messageStore, entries) {
  // warmup
  for (const { streamName } of entries.slice(0, 10)) {
    await messageStore.getStream(streamName)
  }

  const start = process.hrtime.bigint()

  for (const { streamName } of entries) {
    await messageStore.getStream(streamName)

    // strictEqual(messageData.data.someAttribute, found.data.someAttribute)
  }

  const end = process.hrtime.bigint()

  return { count: entries.length, start, end }
}
