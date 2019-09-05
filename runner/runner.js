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
      triggerTask(name, args)
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
    // mimick allSettled
    const promises = active.map(p => p.catch(() => {}))
    return Promise.all(promises)
  }

  const stats = () => {
    return { active: active.length, queued: queue.length }
  }

  return { pause, stats, stop, trigger, unpause }
}
