const { bulkWrite } = require('../bulk-write')
const { initializeStore } = require('./init')

const category = process.env.CATEGORY || 'testPostgresConsumer'
const concurrency = Number(process.env.CONCURRENCY || 3)
const total = Number(process.env.TOTAL || 1e6)
const streams = Number(process.env.STREAMS || 4)
const delayMilliseconds = Number(process.env.DELAY || 0)

const messageStore = initializeStore()
bulkWrite({ category, concurrency, total, messageStore, streams, delayMilliseconds })
