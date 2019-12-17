const fs = require('fs')
const path = require('path')
const si = require('systeminformation')
const { bulkWrite } = require('../bulk-write')
const { createConsumer } = require('../../../consumer')
const { exampleCategory } = require('../../../message-store')
const { initializeStore, log } = require('../interactive/init')
const { InteractiveMessage } = require('../interactive/messages')
const { promisify } = require('util')

benchmark()

async function benchmark () {
  const messageStore = initializeStore()
  const category = exampleCategory('NoOpConsumerBenchmark', { randomize: true })
  const total = 1e6
  await bulkWrite({ category, concurrency: 3, total, messageStore, streams: 3 })

  console.log('done writing messages')
  console.log('starting consumer')

  const { count, startTime, lastProcessedTime } = await consume(messageStore, category, total)

  const stats = await computeStats(count, startTime, lastProcessedTime)

  console.log('Statistics:', stats)

  await writeStatsFile(stats)
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

async function computeStats (count, startTime, lastProcessedTime) {
  const date = new Date()
  const duration = lastProcessedTime ? Number(lastProcessedTime - startTime) : 0
  const durationMicroSeconds = duration / 1000
  const durationSeconds = duration / 1e9
  const consumedPerSecond = duration ? count / durationSeconds : 0
  const averageOverheadMicroSeconds = count ? durationMicroSeconds / count : 0

  const systemInfo = await getSystemInfo()

  const stats = {
    date,
    count,
    durationMicroSeconds: +durationMicroSeconds.toFixed(3),
    averageOverheadMicroSeconds: +averageOverheadMicroSeconds.toFixed(3),
    consumedPerSecond: +consumedPerSecond.toFixed(3),
    ...systemInfo
  }

  return stats
}

const getSystemInfo = async () => {
  const os = await si.osInfo()
  const cpu = await si.cpu()
  return {
    cpu,
    os: {
      platform: os.platform,
      distro: os.distro,
      release: os.release,
      kernel: os.kernel,
      arch: os.arch,
      servicepack: os.servicepack
    }
  }
}

async function writeStatsFile (stats) {
  const dateSlug = stats.date.toISOString().substring(0, 19).replace(/:/g, '-')
  const file = path.resolve(__dirname, 'results', `noop-consumer-${dateSlug}.results.json`)
  const writeFile = promisify(fs.writeFile)
  await writeFile(file, JSON.stringify(stats, null, '  '))
}
