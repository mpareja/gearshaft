exports.startHost = (fn, /* istanbul ignore next */ systemProcess = process) => {
  const consumers = []

  const register = (consumer) => consumers.push(consumer)

  fn({ register })

  hostConsumers(consumers, systemProcess)
}

const hostConsumers = (consumers, systemProcess) => {
  const runners = consumers.map(consumer => consumer.start())

  systemProcess.on('SIGCONT', () => {
    runners.forEach(runner => runner.unpause())
  })

  systemProcess.on('SIGINT', () => {
    runners.forEach(runner => runner.stop())
  })

  systemProcess.on('SIGTERM', () => {
    runners.forEach(runner => runner.stop())
  })

  systemProcess.on('SIGTSTP', () => {
    runners.forEach(runner => runner.pause())
  })
}
