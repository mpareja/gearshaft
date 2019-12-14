const { AssertionError } = require('assert')
const { assertStrictEqual } = require('../')
const { catchError } = require('../catch-error')

describe('assertStrictEqual', () => {
  describe('values are not equal', () => {
    it('throws error', () => {
      const error = catchError(() => assertStrictEqual(1, 2))

      expect(error).toBeInstanceOf(AssertionError)
      expect(error.actual).toBe(1)
      expect(error.expected).toBe(2)
    })

    it('excludes supplied function from stack', function suppliedFunction () {
      const error = catchError(() => assertStrictEqual(1, 2, suppliedFunction))

      expect(error.stack).not.toMatch(/suppliedFunction/g)
    })

    it('includes supplied message', () => {
      const message = 'some message'
      const error = catchError(() => assertStrictEqual(1, 2, undefined, message))

      expect(error.message).toBe(message)
    })
  })

  describe('equivalent value but different references', () => {
    it('throws error', () => {
      const actual = {}
      const expected = {}
      const error = catchError(() => assertStrictEqual(actual, expected))

      expect(error).toBeInstanceOf(AssertionError)
      expect(error.actual).toBe(actual)
      expect(error.expected).toBe(expected)
    })
  })

  describe('values are equal', () => {
    it('does not throw error', () => {
      const error = catchError(() => assertStrictEqual(1, 1))

      expect(error).not.toBeDefined()
    })
  })
})
