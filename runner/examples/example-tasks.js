exports.exampleTasks = () => {
  const taskCalls = []
  const task = async (...args) => taskCalls.push(args)
  task.calls = taskCalls

  let blockedResolve, blockedReject
  const blockedTask = () => new Promise((resolve, reject) => {
    blockedResolve = resolve
    blockedReject = reject
  })
  blockedTask.unblock = () => blockedResolve()
  blockedTask.unblockWithError = () => blockedReject(new Error('bogus'))

  return { blockedTask, task }
}
