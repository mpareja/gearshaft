exports.createRunner = ({ tasks }) => {
  const active = []
  let queue = []
  let stopped = false
  let paused = false

  const trigger = (name, ...args) => {
    if (stopped) { return }
    if (paused) {
      queue.push([name, args])
    } else {
      // We don't want to immediately trigger the task because
      // sync tasks could keep triggering other sync tasks preventing
      // async tasks from completing (and even preventing the
      // pausing/stopping of the runner)
      setImmediate(() => {
        triggerTask(name, args)
      })
    }
  }

  const triggerTask = (name, args) => {
    let promise = tasks[name](...args)

    if (promise instanceof Promise) {
      promise = promise.finally(() => {
        const ix = active.indexOf(promise)
        active.splice(ix, 1)
      })

      active.push(promise)
    }
  }

  const pause = () => {
    paused = true
    return awaitActive()
  }

  const unpause = () => {
    if (stopped) { return }
    paused = false
    queue.forEach((args) => triggerTask(...args))
    queue = []
  }

  const stop = () => {
    stopped = true
    return awaitActive()
  }

  const awaitActive = () => {
    return Promise.all(active)
  }

  const stats = () => {
    return { active: active.length, paused, stopped, queued: queue.length }
  }

  return { pause, stats, stop, trigger, unpause }
}
