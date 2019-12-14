const { assertStrictEqual } = require('../../errors')
const { createMessageStore } = require('../../message-store/memory')
const { createWriter } = require('../write')
const { ExpectedVersionError } = require('../../message-store')

exports.createWriterSubstitute = (messageStore) => {
  messageStore = messageStore || createMessageStore()
  const calls = []
  const write = createWriter({ messageStore })

  write.assertNoWrites = (expectedStreamName) => {
    if (expectedStreamName) {
      assertStreamWrites(write.assertNoWrites, expectedStreamName, [])
    } else {
      assertStrictEqual(calls.length, 0, write.assertNoWrites,
        'Expected 0 writes to any streams')
    }
  }

  write.assertOnlyWrite = (...args) => {
    return assertOnlyWrite(write.assertOnlyWrite, ...args)
  }

  write.assertOnlyWriteInitial = (expectedStreamName, assertions) => {
    return assertOnlyWrite(write.assertOnlyWriteInitial, expectedStreamName, -1, assertions)
  }

  write.assertStreamWrites = (...args) => {
    return assertStreamWrites(write.assertStreamWrites, ...args)
  }

  const assertStreamWrites = (assertFn, expectedStreamName, expectedExpectedVersion, assertions) => {
    const streamCalls = calls.filter(c => c.streamName === expectedStreamName)
    if (Array.isArray(expectedExpectedVersion)) {
      assertions = expectedExpectedVersion
      expectedExpectedVersion = undefined
    }

    if (typeof expectedExpectedVersion === 'number') {
      const { expectedVersion } = streamCalls[0]
      assertStrictEqual(expectedVersion, expectedExpectedVersion, assertFn,
        `Expected write to stream "${expectedStreamName}" with expectedVersion of ${expectedExpectedVersion}`)
    }

    // perform assertions, even on subsets, so user can get feedback on the
    // messages that _were_ written
    assertions.forEach((assertion, ix) => {
      const call = streamCalls[ix]
      if (call) {
        assertion(call.message)
      }
    })

    const msg = assertions.length === 1
      ? `Expected exactly ${assertions.length} write to stream "${expectedStreamName}"`
      : `Expected exactly ${assertions.length} writes to stream "${expectedStreamName}"`
    assertStrictEqual(streamCalls.length, assertions.length, assertFn, msg)
  }

  const assertOnlyWrite = (assertFn, expectedStreamName, expectedExpectedVersion, assertions) => {
    assertStrictEqual(calls.length, 1, assertFn,
      `Expected exactly 1 write to stream "${expectedStreamName}"`)

    const { streamName, expectedVersion, message } = calls[0]

    assertStrictEqual(streamName, expectedStreamName, assertFn,
        `Expected exactly 1 write to stream "${expectedStreamName}"`)

    if (typeof expectedExpectedVersion === 'function') {
      assertions = expectedExpectedVersion
      expectedExpectedVersion = undefined
    }

    if (typeof expectedExpectedVersion === 'number') {
      assertStrictEqual(expectedVersion, expectedExpectedVersion, assertFn,
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
