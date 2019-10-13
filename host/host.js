exports.startHost = (fn, /* istanbul ignore next */ systemProcess = process) => {
  const consumers = []

  const register = (consumer) => consumers.push(consumer)

  fn({ register })

  const host = createHost(consumers, systemProcess)

  return host
}

const createHost = (consumers, systemProcess) => {
  const runners = consumers.map(consumer => consumer.start())

  const pause = () => runners.forEach(runner => runner.pause())
  const unpause = () => runners.forEach(runner => runner.unpause())
  const stop = () => runners.forEach(runner => runner.stop())

  systemProcess.on('SIGCONT', unpause)
  systemProcess.on('SIGINT', stop)
  systemProcess.on('SIGTERM', stop)
  systemProcess.on('SIGTSTP', pause)

  return { stop, pause, unpause }
}
