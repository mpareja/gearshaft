const { AssertionError } = require('assert')
const { createWriterSubstitute } = require('../../write/substitute')
const { exampleMessage } = require('../../../messaging/examples')
const { ExpectedVersionError } = require('../../../message-store')

const WRITEN_STREAM_NAME = 'SomeStream'
const WRITEN_EXPECTED_VERSION = -1
const WRITEN_MESSAGE = exampleMessage()

const setupWrite = async () => {
  const write = createWriterSubstitute()
  await write(WRITEN_MESSAGE, WRITEN_STREAM_NAME, { expectedVersion: WRITEN_EXPECTED_VERSION })
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
  describe('assertOnlyWrite', () => {
    describe('given no writes', () => {
      it('throws an error', () => {
        const write = createWriterSubstitute()
        const streamName = 'SomeStream'

        const error = catchError(() => write.assertOnlyWrite(streamName))

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

          const error = catchError(() => write.assertOnlyWrite(WRITEN_STREAM_NAME))

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
          expect(error.actual).toBe(WRITEN_STREAM_NAME)
        })
      })
    })

    describe('assertion includes expected version', () => {
      describe('given a single write with the expected version', () => {
        it('no error is thrown', async () => {
          const write = await setupWrite()

          const error = catchError(() => write.assertOnlyWrite(WRITEN_STREAM_NAME, WRITEN_EXPECTED_VERSION))

          expect(error).not.toBeDefined()
        })
      })

      describe('given a single write with an unexpected version', () => {
        it('throws an error', async () => {
          const write = await setupWrite()

          const error = catchError(() => write.assertOnlyWrite(WRITEN_STREAM_NAME, 666))

          expect(error).toBeDefined()
          expect(error).toBeInstanceOf(AssertionError)
          expect(error.message).toBe('Expected write to stream "SomeStream" with expectedVersion of 666')
          expect(error.expected).toBe(666)
          expect(error.actual).toBe(WRITEN_EXPECTED_VERSION)
        })
      })
    })

    describe('assertion includes supplied assertion function', () => {
      describe('given a single write with the expected stream name and no assertion errors', () => {
        it('no error is thrown', async () => {
          const write = await setupWrite()

          const error = catchError(() => write.assertOnlyWrite(WRITEN_STREAM_NAME, () => {}))

          expect(error).not.toBeDefined()
        })

        it('assertion function receives message', async () => {
          const write = await setupWrite()

          let receivedMessage
          write.assertOnlyWrite(WRITEN_STREAM_NAME, m => {
            receivedMessage = m
          })

          expect(receivedMessage).toBe(WRITEN_MESSAGE)
        })
      })

      describe('given a single write with the expected stream name and assertion errors', () => {
        it('assertion errors are thrown', async () => {
          const write = await setupWrite()
          const exampleError = new Error('bogus error')

          const error = catchError(() => write.assertOnlyWrite(WRITEN_STREAM_NAME, () => {
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

          const error = catchError(() => write.assertOnlyWrite(WRITEN_STREAM_NAME, WRITEN_EXPECTED_VERSION, () => {
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
        await write(WRITEN_MESSAGE, WRITEN_STREAM_NAME)

        const error = catchError(() => write.assertOnlyWriteInitial(WRITEN_STREAM_NAME))

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
        await write.initial(WRITEN_MESSAGE, WRITEN_STREAM_NAME)

        const error = catchError(() => write.assertOnlyWriteInitial(WRITEN_STREAM_NAME))

        expect(error).not.toBeDefined()
      })
    })
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
          write(WRITEN_MESSAGE, WRITEN_STREAM_NAME))

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
          write(WRITEN_MESSAGE, WRITEN_STREAM_NAME))

        expect(error).toBeDefined()
        expect(error).toBeInstanceOf(ExpectedVersionError)
      })
    })
  })
})
