const { operationError } = require('../')

const A_DETAIL = 'some detail'
const AN_OPERATION = 'fetch-operation'

describe('operation-error', () => {
  const makeError = operationError(AN_OPERATION)

  describe('no inner exception', () => {
    const e = makeError(A_DETAIL)

    it('error is instance of Error', () => {
      expect(e).toBeInstanceOf(Error)
    })

    it('message includes operation and error detail', () => {
      expect(e.message).toBe('fetch-operation: some detail')
    })

    it('does not set inner property', () => {
      expect(e).not.toHaveProperty('inner')
    })
  })

  describe('with inner exception', () => {
    it('inner is included as a property', () => {
      const inner = new Error('inner-bogus')
      const e = operationError(AN_OPERATION)(A_DETAIL, inner)

      expect(e.inner).toBe(inner)
    })
  })
})
