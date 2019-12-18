const { computeStats } = require('../compute-stats')

describe('compute-stats', () => {
  describe('with end time', () => {
    it('duration is zero', async () => {
      const now = new Date()
      const count = 100
      const start = 1000n
      const end = 1001000n

      const stats = await computeStats(count, start, end)

      expect(stats.date).toEqual(expect.any(Date))
      expect(stats.date - now).toBeLessThan(1000)
      expect(stats.count).toBe(count)
      expect(stats.durationMicroSeconds).toBe(1000)
      expect(stats.averageOverheadMicroSeconds).toBe(10)
      expect(stats.operationsPerSecond).toBe(100000) // 100 / 1ms
      expect(stats.cpu).toBeDefined()
      expect(stats.os).toBeDefined()
    })
  })

  describe('without end time', () => {
    it('time-based calculations are 0', async () => {
      const start = 0n

      const stats = await computeStats(100, start)

      expect(stats.durationMicroSeconds).toBe(0)
      expect(stats.operationsPerSecond).toBe(0)
      expect(stats.averageOverheadMicroSeconds).toBe(0)
    })
  })

  describe('with count of zero', () => {
    it('averageOverheadMicroSeconds is 0', async () => {
      const count = 0
      const start = 1000n
      const end = 1001000n

      const stats = await computeStats(count, start, end)

      expect(stats.averageOverheadMicroSeconds).toBe(0)
    })
  })
})
