const { AssertionError } = require('assert')
const { createWriter } = require('../write')
const { ExpectedVersionError } = require('../../message-store')

exports.createWriterSubstitute = () => {
  const calls = []
  const store = { write: () => {} }
  const write = createWriter({ store })

  write.assertOnlyWrite = (...args) => {
    return assertOnlyWrite(write.assertOnlyWrite, ...args)
  }

  write.assertOnlyWriteInitial = (expectedStreamName, assertions) => {
    return assertOnlyWrite(write.assertOnlyWriteInitial, expectedStreamName, -1, assertions)
  }

  const assertEqual = (actual, expected, stackStartFn, message) => {
    if (actual !== expected) {
      throw new AssertionError({
        message,
        expected,
        actual,
        stackStartFn
      })
    }
  }

  const assertOnlyWrite = (assertFn, expectedStreamName, expectedExpectedVersion, assertions) => {
    assertEqual(calls.length, 1, assertFn,
      `Expected exactly 1 write to stream "${expectedStreamName}"`)

    const { streamName, expectedVersion, message } = calls[0]

    assertEqual(streamName, expectedStreamName, assertFn,
        `Expected exactly 1 write to stream "${expectedStreamName}"`)

    if (typeof expectedExpectedVersion === 'function') {
      assertions = expectedExpectedVersion
      expectedExpectedVersion = undefined
    }

    if (typeof expectedExpectedVersion === 'number') {
      assertEqual(expectedVersion, expectedExpectedVersion, assertFn,
        `Expected write to stream "${expectedStreamName}" with expectedVersion of ${expectedExpectedVersion}`)
    }

    if (typeof assertions === 'function') {
      assertions(message)
    }
  }

  let errorToThrow
  write.stubError = (error) => {
    errorToThrow = error
  }

  write.stubExpectedVersionError = () => {
    errorToThrow = new ExpectedVersionError()
  }

  write.emitter.on('written', (written) => {
    if (errorToThrow) {
      throw errorToThrow
    }
    calls.push(written)
  })
  return write
}
