const { ExampleError, exampleOperation } = require('../examples')
const { retry } = require('../')

describe('retry', () => {
  describe('given no errors thrown', () => {
    it('operation is called once', async () => {
      const operation = exampleOperation()

      await retry([ExampleError], operation)

      expect(operation.calls).toBe(1)
    })

    it('the resolved value is returned', async () => {
      const operation = () => 'someValue'

      const value = await retry([ExampleError], operation)

      expect(value).toBe('someValue')
    })
  })

  describe('given one of the specified errors are thrown', () => {
    it('retries the operation', async () => {
      const operation = exampleOperation({
        errorSchedule: [new ExampleError()]
      })

      await retry([ExampleError], operation)

      expect(operation.calls).toBe(2)
    })
  })

  describe('given an unspecified error is thrown', () => {
    it('propagates the error', async () => {
      const thrownError = new Error()
      const operation = exampleOperation({
        errorSchedule: [new ExampleError(), thrownError]
      })

      const error = await retry([ExampleError], operation).catch(err => err)

      expect(operation.calls).toBe(1)
      expect(error).toBe(thrownError)
    })
  })
})
