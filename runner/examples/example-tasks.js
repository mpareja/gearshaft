exports.exampleTasks = () => {
  const taskCalls = []
  const task = async (...args) => taskCalls.push(args)
  task.calls = taskCalls

  let blockedResolve
  const blockedTask = () => new Promise((resolve) => {
    blockedResolve = resolve
  })
  blockedTask.unblock = () => blockedResolve()

  return { blockedTask, task }
}
