const { benchmark } = require('../../../test/benchmark/write-single-message.benchmark')
const { createMessageStore } = require('../../')

benchmark(createMessageStore, __filename)
