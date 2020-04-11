const { benchmark } = require('../../../test/benchmark/write-single-message.benchmark')
const { initializeStore } = require('./init')

benchmark(initializeStore, __filename)
