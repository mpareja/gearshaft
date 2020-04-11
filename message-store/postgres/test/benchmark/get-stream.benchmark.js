const { benchmark } = require('../../../test/benchmark/get-stream.benchmark')
const { initializeStore } = require('./init')

benchmark(initializeStore, __filename)
