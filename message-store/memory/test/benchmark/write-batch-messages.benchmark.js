const { benchmark } = require('../../../test/benchmark/write-batch-messages.benchmark')
const { initializeStore } = require('./init')

benchmark(initializeStore, __filename)
