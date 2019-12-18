const { getSystemInfo } = require('./system-info')

exports.computeStats = async (count, startTime, endTime) => {
  const date = new Date()
  const duration = endTime ? Number(endTime - startTime) : 0
  const durationMicroSeconds = duration / 1000
  const durationSeconds = duration / 1e9
  const operationsPerSecond = duration ? count / durationSeconds : 0
  const averageOverheadMicroSeconds = count ? durationMicroSeconds / count : 0

  const systemInfo = await getSystemInfo()

  const stats = {
    date,
    count,
    durationMicroSeconds: +durationMicroSeconds.toFixed(3),
    averageOverheadMicroSeconds: +averageOverheadMicroSeconds.toFixed(3),
    operationsPerSecond: +operationsPerSecond.toFixed(3),
    ...systemInfo
  }

  return stats
}
