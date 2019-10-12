const { createRunner } = require('../runner')
const { exampleTasks } = require('./example-tasks')

exports.exampleRunner = () => {
  const tasks = exampleTasks()
  const runner = createRunner({ tasks })
  runner.tasks = tasks

  return runner
}
