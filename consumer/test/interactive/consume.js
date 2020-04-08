const { createConsumer } = require('../../../consumer')
const { initializeStore, log } = require('./init')
const { InteractiveErrorMessage, InteractiveMessage } = require('./messages')

const category = process.env.CATEGORY || 'testPostgresConsumer'

let identifier, groupSize, groupMember
if (process.env.GROUP_SIZE) {
  identifier = process.env.IDENTIFIER
  groupSize = Number(process.env.GROUP_SIZE)
  groupMember = Number(process.env.GROUP_MEMBER)
}

const messageStore = initializeStore()

let count = 0n
let lastProcessedTime

const registerHandlers = (register) => {
  register(InteractiveMessage, (message) => {
    count++
    lastProcessedTime = process.hrtime.bigint()
  })
  register(InteractiveErrorMessage, (input) => {
    throw new Error('bogus input error')
  })
}

const consumer = createConsumer({
  category, log, name: 'interactive', registerHandlers, messageStore, identifier, groupSize, groupMember
})

const startTime = process.hrtime.bigint()
const runner = consumer.start()

// trigger stats emission on window resize
process.on('SIGWINCH', async () => {
  console.log('Runner Stats:', runner.stats())
  console.log('# of Handler Calls:', count)

  if (lastProcessedTime) {
    const micros = (lastProcessedTime - startTime) / 1000n
    const seconds = micros / 1000000n
    console.error('Processing Time (first to last message):', micros, 'microseconds')
    console.error('Avg. Overhead:', count ? micros / count : '-', 'microseconds')
    console.error('Throughput:', seconds ? count / seconds : '-', 'per second')
  }
})
