const { exampleRunner } = require('../../runner')

exports.exampleConsumer = () => {
  const runner = exampleRunner()
  const consumer = {
    runner,
    started: false,
    start: () => {
      consumer.started = true
      return runner
    }
  }

  return consumer
}
