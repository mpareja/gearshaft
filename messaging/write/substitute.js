const { AssertionError } = require('assert')
const { createWriter } = require('../write')

exports.createWriterSubstitute = () => {
  const calls = []
  const store = { write: () => {} }
  const write = createWriter({ store })

  const assertEqual = (actual, expected, message) => {
    if (actual !== expected) {
      throw new AssertionError({
        message,
        expected,
        actual,
        stackStartFn: write.assertOnlyWrite
      })
    }
  }

  write.assertOnlyWrite = (expectedStreamName, expectedExpectedVersion, assertions) => {
    assertEqual(calls.length, 1, `Expected exactly 1 write to stream "${expectedStreamName}"`)

    const { streamName, expectedVersion, message } = calls[0]

    assertEqual(streamName, expectedStreamName,
        `Expected exactly 1 write to stream "${expectedStreamName}"`)

    if (typeof expectedExpectedVersion === 'function') {
      assertions = expectedExpectedVersion
      expectedExpectedVersion = undefined
    }

    if (typeof expectedExpectedVersion === 'number') {
      assertEqual(expectedVersion, expectedExpectedVersion,
        `Expected write to stream "${expectedStreamName}" with expectedVersion of ${expectedExpectedVersion}`)
    }

    if (typeof assertions === 'function') {
      assertions(message)
    }
  }

  write.emitter.on('written', (written) => {
    calls.push(written)
  })
  return write
}
