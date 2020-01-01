const { AssertionError } = require('assert')
const { createWriterSubstitute } = require('../../write/substitute')
const { exampleMessage } = require('../../../messaging/examples')
const { ExpectedVersionError, exampleMessageStore, exampleStreamName } = require('../../../message-store')

const WRITTEN_STREAM_NAME = 'SomeStream'
const WRITTEN_EXPECTED_VERSION = -1
const WRITTEN_MESSAGE = exampleMessage()
const WRITTEN_MESSAGE_2 = exampleMessage()

const setupWrite = async () => {
  const write = createWriterSubstitute()
  await write(WRITTEN_MESSAGE, WRITTEN_STREAM_NAME, { expectedVersion: WRITTEN_EXPECTED_VERSION })
  return write
}

const catchError = (fn) => {
  try {
    fn()
  } catch (error) {
    return error
  }
}

describe('write-substitute', () => {
  describe('assertNoWrites', () => {
    describe('given no writes on any streams', () => {
      it('no error is thrown', async () => {
        const write = createWriterSubstitute()

        const error = catchError(() => write.assertNoWrites())

        expect(error).not.toBeDefined()
      })
    })

    describe('given writes to a stream', () => {
      it('throws an error', async () => {
        const write = await setupWrite()

        const error = catchError(() => write.assertNoWrites())

        expect(error).toBeDefined()
        expect(error).toBeInstanceOf(AssertionError)
        expect(error.message).toBe('Expected 0 writes to any streams')
        expect(error.expected).toBe(0)
        expect(error.actual).toBe(1)
      })
    })

    describe('given writes to unrelated stream but no writes to specified stream', () => {
      it('no error is thrown', async () => {
        const write = await setupWrite()
        const unrelatedStreamName = exampleStreamName()

        const error = catchError(() => write.assertNoWrites(unrelatedStreamName))

        expect(error).not.toBeDefined()
      })
    })

    describe('given writes to the specified stream', () => {
      it('no error is thrown', async () => {
        const write = await setupWrite()

        const error = catchError(() => write.assertNoWrites(WRITTEN_STREAM_NAME))

        expect(error).toBeDefined()
        expect(error).toBeInstanceOf(AssertionError)
        expect(error.message).toBe('Expected exactly 0 writes to stream "SomeStream"')
        expect(error.expected).toBe(0)
        expect(error.actual).toBe(1)
      })
    })
  })

  describe('assertOnlyWrite', () => {
    describe('given no writes', () => {
      it('throws an error', () => {
        const write = createWriterSubstitute()

        const error = catchError(() => write.assertOnlyWrite(WRITTEN_STREAM_NAME))

        expect(error).toBeDefined()
        expect(error).toBeInstanceOf(AssertionError)
        expect(error.message).toBe('Expected exactly 1 write to stream "SomeStream"')
        expect(error.expected).toBe(1)
        expect(error.actual).toBe(0)
      })
    })

    describe('assertion limited to stream name', () => {
      describe('given a single write with the expected stream name', () => {
        it('no error is thrown', async () => {
          const write = await setupWrite()

          const error = catchError(() => write.assertOnlyWrite(WRITTEN_STREAM_NAME))

          expect(error).not.toBeDefined()
        })
      })

      describe('given a single write with an unexpected stream name', () => {
        it('throws an error', async () => {
          const write = await setupWrite()

          const error = catchError(() => write.assertOnlyWrite('expectedStreamName'))

          expect(error).toBeDefined()
          expect(error).toBeInstanceOf(AssertionError)
          expect(error.message).toBe('Expected exactly 1 write to stream "expectedStreamName"')
          expect(error.expected).toBe('expectedStreamName')
          expect(error.actual).toBe(WRITTEN_STREAM_NAME)
        })
      })
    })

    describe('assertion includes expected version', () => {
      describe('given a single write with the expected version', () => {
        it('no error is thrown', async () => {
          const write = await setupWrite()

          const error = catchError(() => write.assertOnlyWrite(WRITTEN_STREAM_NAME, WRITTEN_EXPECTED_VERSION))

          expect(error).not.toBeDefined()
        })
      })

      describe('given a single write with an unexpected version', () => {
        it('throws an error', async () => {
          const write = await setupWrite()

          const error = catchError(() => write.assertOnlyWrite(WRITTEN_STREAM_NAME, 666))

          expect(error).toBeDefined()
          expect(error).toBeInstanceOf(AssertionError)
          expect(error.message).toBe('Expected write to stream "SomeStream" with expectedVersion of 666')
          expect(error.expected).toBe(666)
          expect(error.actual).toBe(WRITTEN_EXPECTED_VERSION)
        })
      })
    })

    describe('assertion includes supplied assertion function', () => {
      describe('given a single write with the expected stream name and no assertion errors', () => {
        it('no error is thrown', async () => {
          const write = await setupWrite()

          const error = catchError(() => write.assertOnlyWrite(WRITTEN_STREAM_NAME, () => {}))

          expect(error).not.toBeDefined()
        })

        it('assertion function receives message', async () => {
          const write = await setupWrite()

          let receivedMessage
          write.assertOnlyWrite(WRITTEN_STREAM_NAME, m => {
            receivedMessage = m
          })

          expect(receivedMessage).toBe(WRITTEN_MESSAGE)
        })
      })

      describe('given a single write with the expected stream name and assertion errors', () => {
        it('assertion errors are thrown', async () => {
          const write = await setupWrite()
          const exampleError = new Error('bogus error')

          const error = catchError(() => write.assertOnlyWrite(WRITTEN_STREAM_NAME, () => {
            throw exampleError
          }))

          expect(error).toBeDefined()
          expect(error).toBe(exampleError)
        })
      })

      describe('given a single write with the expected stream name, expectedVersion, and assertion errors', () => {
        it('assertion errors are thrown', async () => {
          const write = await setupWrite()
          const exampleError = new Error('bogus error')

          const error = catchError(() => write.assertOnlyWrite(WRITTEN_STREAM_NAME, WRITTEN_EXPECTED_VERSION, () => {
            throw exampleError
          }))

          expect(error).toBe(exampleError)
        })
      })
    })
  })

  describe('assertOnlyWriteInitial', () => {
    describe('given a single write with an unexpected version', () => {
      it('throws an error', async () => {
        const write = createWriterSubstitute()
        await write(WRITTEN_MESSAGE, WRITTEN_STREAM_NAME)

        const error = catchError(() => write.assertOnlyWriteInitial(WRITTEN_STREAM_NAME))

        expect(error).toBeDefined()
        expect(error).toBeInstanceOf(AssertionError)
        expect(error.message).toBe('Expected write to stream "SomeStream" with expectedVersion of -1')
        expect(error.expected).toBe(-1)
        expect(error.actual).toBe(undefined)
      })
    })

    describe('given a single write to initialize a stream', () => {
      it('no error is thrown', async () => {
        const write = createWriterSubstitute()
        await write.initial(WRITTEN_MESSAGE, WRITTEN_STREAM_NAME)

        const error = catchError(() => write.assertOnlyWriteInitial(WRITTEN_STREAM_NAME))

        expect(error).not.toBeDefined()
      })
    })
  })

  describe('assertStreamWrites', () => {
    const setupTwoWrites = async () => {
      const write = createWriterSubstitute()
      const batch = [WRITTEN_MESSAGE, WRITTEN_MESSAGE_2]
      await write(batch, WRITTEN_STREAM_NAME, { expectedVersion: WRITTEN_EXPECTED_VERSION })
      return write
    }

    describe('given the expected writes', () => {
      it('no error is thrown', async () => {
        const write = await setupTwoWrites()

        const error = catchError(() => write.assertStreamWrites(WRITTEN_STREAM_NAME, [
          () => {},
          () => {}
        ]))

        expect(error).toBeUndefined()
      })

      it('message is provided to assertion function', async () => {
        const write = await setupWrite()

        const assertions = []
        write.assertStreamWrites(WRITTEN_STREAM_NAME, [
          (message) => { assertions.push(message) }
        ])

        expect(assertions).toHaveLength(1)
        expect(assertions[0]).toEqual(WRITTEN_MESSAGE)
      })
    })

    describe('given 0 of 1 expected write', () => {
      it('throws an error', () => {
        const write = createWriterSubstitute()

        const error = catchError(() => write.assertStreamWrites(WRITTEN_STREAM_NAME, [() => {}]))

        expect(error).toBeDefined()
        expect(error).toBeInstanceOf(AssertionError)
        expect(error.message).toBe('Expected exactly 1 write to stream "SomeStream"')
        expect(error.expected).toBe(1)
        expect(error.actual).toBe(0)
      })
    })

    describe('given 0 of 2 expected writes', () => {
      it('throws an error', () => {
        const write = createWriterSubstitute()

        const error = catchError(() => write.assertStreamWrites(WRITTEN_STREAM_NAME, [() => {}, () => {}]))

        expect(error).toBeDefined()
        expect(error).toBeInstanceOf(AssertionError)
        expect(error.message).toBe('Expected exactly 2 writes to stream "SomeStream"')
        expect(error.expected).toBe(2)
        expect(error.actual).toBe(0)
      })
    })

    describe('given a 1 of 2 expected writes', () => {
      it('throws error noting the number of missing messages', async () => {
        const write = await setupWrite()

        const error = catchError(() => write.assertStreamWrites(WRITTEN_STREAM_NAME, [
          () => {},
          () => {}
        ]))

        expect(error).toBeDefined()
        expect(error).toBeInstanceOf(AssertionError)
        expect(error.message).toBe('Expected exactly 2 writes to stream "SomeStream"')
        expect(error.expected).toBe(2)
        expect(error.actual).toBe(1)
      })
    })

    describe('given a 1 of 2 expected writes', () => {
      it('2nd assertion is not attempted', async () => {
        const write = await setupWrite()

        let called = false
        catchError(() => write.assertStreamWrites(WRITTEN_STREAM_NAME, [
          () => {},
          () => { called = true }
        ]))

        expect(called).toBe(false)
      })
    })

    describe('given a 1 of 2 expected writes and assertion fails', () => {
      it('propagates the assertion error (rather than number of writes error)', async () => {
        const write = await setupWrite()

        const assertionError = new Error()
        const error = catchError(() => write.assertStreamWrites(WRITTEN_STREAM_NAME, [
          () => { throw assertionError },
          () => {}
        ]))

        expect(error).toBe(assertionError)
      })
    })

    describe('assertion includes expected version', () => {
      describe('given a write with the expected version', () => {
        it('no error is thrown', async () => {
          const write = await setupWrite()

          const error = catchError(() =>
            write.assertStreamWrites(WRITTEN_STREAM_NAME, WRITTEN_EXPECTED_VERSION, [() => {}]))

          expect(error).toBeUndefined()
        })

        it('written message is provided to assertion function', async () => {
          const write = await setupWrite()

          let receivedMessage
          write.assertOnlyWrite(WRITTEN_STREAM_NAME, m => {
            receivedMessage = m
          })

          expect(receivedMessage).toBe(WRITTEN_MESSAGE)
        })
      })

      describe('given a write with an unexpected version', () => {
        it('throws error noting the unexpected version', async () => {
          const write = await setupWrite()

          const error = catchError(() =>
            write.assertStreamWrites(WRITTEN_STREAM_NAME, 666, [() => {}]))

          expect(error).toBeDefined()
          expect(error).toBeInstanceOf(AssertionError)
          expect(error.message).toBe('Expected write to stream "SomeStream" with expectedVersion of 666')
          expect(error.expected).toBe(666)
          expect(error.actual).toBe(WRITTEN_EXPECTED_VERSION)
        })
      })

      describe('given a write with the expected version and an assertion error', () => {
        it('propagates the assertion error', async () => {
          const write = await setupWrite()

          const assertionError = new Error()
          const error = catchError(() =>
            write.assertStreamWrites(WRITTEN_STREAM_NAME, WRITTEN_EXPECTED_VERSION, [
              () => { throw assertionError },
              () => {}
            ]))

          expect(error).toBe(assertionError)
        })
      })

      describe('given no writes to expected stream', () => {
        it('throws error noting the number of missing messages', async () => {
          const write = createWriterSubstitute()

          const error = catchError(() =>
            write.assertStreamWrites(WRITTEN_STREAM_NAME, WRITTEN_EXPECTED_VERSION, [() => {}]))

          expect(error).toBeDefined()
          expect(error).toBeInstanceOf(AssertionError)
          expect(error.message).toBe('Expected exactly 1 write to stream "SomeStream"')
          expect(error.expected).toBe(1)
          expect(error.actual).toBe(0)
        })
      })
    })

    describe('given writes to multiple streams', () => {
      it('only considers writes to the asserted on stream', async () => {
        const write = createWriterSubstitute()
        await write(WRITTEN_MESSAGE, 'OTHER_STREAM')
        await write(WRITTEN_MESSAGE_2, WRITTEN_STREAM_NAME, { expectedVersion: WRITTEN_EXPECTED_VERSION })

        const assertions = []
        write.assertStreamWrites(WRITTEN_STREAM_NAME, WRITTEN_EXPECTED_VERSION, [
          (message) => { assertions.push(message) }
        ])

        expect(assertions).toHaveLength(1)
        expect(assertions[0]).toEqual(WRITTEN_MESSAGE_2)
      })
    })
  })

  it('uses provided message store', async () => {
    const messageStore = exampleMessageStore()
    const write = createWriterSubstitute(messageStore)

    await write(WRITTEN_MESSAGE, WRITTEN_STREAM_NAME)

    const found = await messageStore.getLast(WRITTEN_STREAM_NAME)

    expect(found.id).toBe(WRITTEN_MESSAGE.id)
  })

  const asyncCatchError = async (fn) => {
    try {
      await fn()
    } catch (error) {
      return error
    }
  }

  describe('stubError', () => {
    describe('given an error to throw and a subsequent write', () => {
      it('throws the supplied error', async () => {
        const write = createWriterSubstitute()
        const expectedError = new Error('bogus error')

        write.stubError(expectedError)

        const error = await asyncCatchError(() =>
          write(WRITTEN_MESSAGE, WRITTEN_STREAM_NAME))

        expect(error).toBe(expectedError)
      })
    })
  })

  describe('stubExpectedVersionError', () => {
    describe('given stubbed to throw expected version error and a subsequent write', () => {
      it('throws expected version error', async () => {
        const write = createWriterSubstitute()

        write.stubExpectedVersionError()

        const error = await asyncCatchError(() =>
          write(WRITTEN_MESSAGE, WRITTEN_STREAM_NAME))

        expect(error).toBeDefined()
        expect(error).toBeInstanceOf(ExpectedVersionError)
      })
    })
  })
})
