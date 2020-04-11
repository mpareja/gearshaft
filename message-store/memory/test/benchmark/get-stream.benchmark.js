const { benchmark } = require('../../../test/benchmark/get-stream.benchmark')
const { createMessageStore } = require('../../')

benchmark(createMessageStore, __filename)
