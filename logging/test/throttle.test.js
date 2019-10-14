const createTestLog = require('../../test/test-log')
const { createFakeClock } = require('./fake-clock')
const { exampleOperation } = require('../examples')
const { throttleErrorLogging } = require('../')

const A_RECOVERY_MESSAGE = 'a-recovery-message'
const AN_ERROR_MESSAGE = 'an-error-message'
const A_CONTEXT = { some: 'context' }

describe('throttle-error-log', () => {
  const setupThrottledOperation = () => {
    const clock = createFakeClock()
    const log = createTestLog()
    const operation = exampleOperation()
    operation.failing()

    const throttled = throttleErrorLogging(
      log, A_CONTEXT, AN_ERROR_MESSAGE, A_RECOVERY_MESSAGE, operation, clock)

    throttled.operation = operation
    throttled.log = log
    throttled.clock = clock

    return throttled
  }

  describe('given an operation finally succeeds', () => {
    it('returns the operation result', async () => {
      const throttled = setupThrottledOperation()

      await throttled().catch(err => err)
      throttled.operation.completing()
      const result = await throttled()

      expect(result).toBe('success result')
    })
  })

  describe('given an operation succeeds on first attempt', () => {
    it('does not log', async () => {
      const log = createTestLog()
      const operation = exampleOperation()
      const throttled = throttleErrorLogging(log, {}, '', '', operation)

      await throttled()

      expect(log.info).not.toHaveBeenCalled()
      expect(log.error).not.toHaveBeenCalled()
    })
  })

  describe('given an operation is failing', () => {
    it('propagates the error', async () => {
      const throttled = setupThrottledOperation()

      const error = await throttled().catch(err => err)

      expect(error).toEqual(new Error('operation failed'))
    })

    it('logs the initial error', async () => {
      const throttled = setupThrottledOperation()

      await throttled().catch(() => {})

      expect(throttled.log.error).toHaveBeenCalledWith({
        errorCount: 1,
        some: 'context',
        err: new Error('operation failed')
      }, AN_ERROR_MESSAGE)
    })

    it('waits 10s before logging the error again', async () => {
      const throttled = setupThrottledOperation()

      await throttled().catch(() => {})
      await throttled().catch(() => {})
      throttled.clock.plusSeconds(10)
      await throttled().catch(() => {})

      expect(throttled.log.error).toHaveBeenCalledTimes(2)
      expect(throttled.log.error).toHaveBeenCalledWith({
        errorCount: 3,
        some: 'context',
        err: new Error('operation failed')
      }, AN_ERROR_MESSAGE)
    })

    it('logs when the operation starts working again', async () => {
      const throttled = setupThrottledOperation()

      await throttled().catch(() => {})
      throttled.operation.completing()
      await throttled()

      expect(throttled.log.info).toHaveBeenCalledWith({
        errorCount: 1,
        some: 'context'
      }, A_RECOVERY_MESSAGE)
    })
  })
})
