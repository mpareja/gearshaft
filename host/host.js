const { EventEmitter } = require('events')

exports.startHost = (fn, /* istanbul ignore next */ systemProcess = process) => {
  const consumers = []

  const register = (consumer) => consumers.push(consumer)

  fn({ register })

  const host = createHost(consumers, systemProcess)

  return host
}

const createHost = (consumers, systemProcess) => {
  const runners = consumers.map(consumer => consumer.start())

  const host = new EventEmitter()

  host.pause = async () => {
    await Promise.all(runners.map(runner => runner.pause()))
    host.emit('paused')
  }
  host.unpause = async () => {
    await runners.forEach(runner => runner.unpause())
    host.emit('unpaused')
  }
  host.stop = async () => {
    await Promise.all(runners.map(runner => runner.stop()))
    host.emit('stopped')
  }

  systemProcess.on('SIGCONT', host.unpause)
  systemProcess.on('SIGINT', host.stop)
  systemProcess.on('SIGTERM', host.stop)
  systemProcess.on('SIGTSTP', host.pause)

  return host
}
