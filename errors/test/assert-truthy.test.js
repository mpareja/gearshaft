const { AssertionError } = require('assert')
const { assertTruthy } = require('../')
const { catchError } = require('../catch-error')

const AN_ERROR_MESSAGE = 'some message'

describe('assertTruthy', () => {
  describe('value is not truthy', () => {
    it('throws error', () => {
      const error = catchError(() => assertTruthy(false, undefined, AN_ERROR_MESSAGE))

      expect(error).toBeInstanceOf(AssertionError)
      expect(error.actual).toBe(false)
    })

    it('excludes supplied function from stack', function suppliedFunction () {
      const error = catchError(() => assertTruthy(false, suppliedFunction, AN_ERROR_MESSAGE))

      expect(error.stack).not.toMatch(/suppliedFunction/g)
    })

    it('includes supplied message', () => {
      const error = catchError(() => assertTruthy(undefined, undefined, AN_ERROR_MESSAGE))

      expect(error.message).toBe(AN_ERROR_MESSAGE)
    })
  })

  describe('value is truthy', () => {
    it('does not throw error', () => {
      const error = catchError(() => assertTruthy(true, undefined, AN_ERROR_MESSAGE))

      expect(error).toBeUndefined()
    })
  })

  describe('error message is not provided', () => {
    it('throws error', () => {
      const error = catchError(() => assertTruthy(true))

      expect(error).toBeInstanceOf(AssertionError)
      expect(error.message).toBe('error message is required')
    })
  })
})
