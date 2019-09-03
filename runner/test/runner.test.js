const { createRunner } = require('../runner')
const { promisify } = require('util')
const setImmediateP = promisify(setImmediate)

const NO_PARAMETERS = []

const exampleTasks = () => {
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

const setupRunBlockedTask = async () => {
  const tasks = exampleTasks()
  const runner = createRunner({ tasks })

  runner.trigger('blockedTask')

  await setImmediateP()

  const { unblock, unblockWithError } = tasks.blockedTask
  return { runner, unblock, unblockWithError }
}

describe('trigger', () => {
  describe('triggering a task without parameters', () => {
    it('runs the task with no parameters', async () => {
      const tasks = exampleTasks()
      const runner = createRunner({ tasks })

      runner.trigger('task')

      expect(tasks.task.calls).toHaveLength(1)
      expect(tasks.task.calls[0]).toEqual(NO_PARAMETERS)
    })
  })

  describe('triggering a task with parameters', () => {
    it('runs the task with supplied parameters', async () => {
      const tasks = exampleTasks()
      const runner = createRunner({ tasks })

      const some = 'value'
      const other = 'values'
      runner.trigger('task', some, other)

      expect(tasks.task.calls).toEqual([
        [some, other]
      ])
    })
  })
})

describe('stats', () => {
  describe('given no tasks triggered', () => {
    it('active tasks is 0', () => {
      const tasks = exampleTasks()
      const runner = createRunner({ tasks })

      expect(runner.stats().active).toEqual(0)
    })
  })

  describe('given a single running task', () => {
    it('active tasks is 1', async () => {
      const { runner } = await setupRunBlockedTask()

      expect(runner.stats().active).toEqual(1)
    })
  })

  describe('given the single running task completes', () => {
    it('active tasks is 0', async () => {
      const { unblock, runner } = await setupRunBlockedTask()

      unblock()
      await setImmediateP()

      expect(runner.stats().active).toEqual(0)
    })
  })

  describe('given a paused runner with a single queued task', () => {
    it('queued tasks is 1', async () => {
      const tasks = exampleTasks()
      const runner = createRunner({ tasks })

      runner.pause()
      runner.trigger('task')

      expect(runner.stats().active).toEqual(0)
      expect(runner.stats().queued).toEqual(1)
    })
  })
})

describe('pause / unpause', () => {
  describe('when a task is triggered while paused', () => {
    it('it does not run the task', async () => {
      const tasks = exampleTasks()
      const runner = createRunner({ tasks })

      runner.pause()
      runner.trigger('task')

      expect(tasks.task.calls).toHaveLength(0)
    })
  })

  describe('unpausing after tasks were triggered while paused', () => {
    it('runs the previously triggered tasks in order', async () => {
      const tasks = exampleTasks()
      const runner = createRunner({ tasks })
      runner.pause()
      runner.trigger('task', 'first')
      runner.trigger('task', 'second')

      runner.unpause()

      await setImmediateP()

      expect(tasks.task.calls).toEqual([
        ['first'],
        ['second']
      ])
    })
  })

  describe('unpausing multiple times', () => {
    it('does not retrigger previously paused tasks', async () => {
      const tasks = exampleTasks()
      const runner = createRunner({ tasks })
      runner.pause()
      runner.trigger('task')

      runner.unpause()
      runner.unpause()

      expect(tasks.task.calls).toHaveLength(1)
    })
  })

  describe('given a long running task', () => {
    it('waits for task to complete', async () => {
      const { runner } = await setupRunBlockedTask()

      let resolved = false
      runner.pause().then(() => { resolved = true })

      await setImmediateP()
      expect(resolved).toBe(false)
    })

    it('pause resolves once task is complete', async () => {
      const { runner, unblock } = await setupRunBlockedTask()

      const promise = runner.pause()

      unblock()

      await promise
    })
  })
})

describe('stop', () => {
  describe('given a long running task', () => {
    it('waits for task to complete', async () => {
      const { runner } = await setupRunBlockedTask()

      let resolved = false
      runner.stop().then(() => { resolved = true })

      await setImmediateP()
      expect(resolved).toBe(false)
    })

    it('stop resolves once task is complete', async () => {
      const { runner, unblock } = await setupRunBlockedTask()

      const promise = runner.stop()

      unblock()

      await promise
    })
  })

  describe('given a long task that fails', () => {
    it('stop resolves once task is complete', async () => {
      const { runner, unblockWithError } = await setupRunBlockedTask()

      const promise = runner.stop()

      unblockWithError()

      await promise
    })
  })

  describe('triggering a task on a stopped runner', () => {
    it('does not run the task', () => {
      const tasks = exampleTasks()
      const runner = createRunner({ tasks })

      runner.stop()
      runner.trigger('task')

      expect(tasks.task.calls).toHaveLength(0)
    })
  })

  describe('unpausing a stopped runner', () => {
    it('does not run queued tasks', () => {
      const tasks = exampleTasks()
      const runner = createRunner({ tasks })

      runner.pause()
      runner.trigger('task')
      runner.stop()

      runner.unpause()

      expect(tasks.task.calls).toHaveLength(0)
    })
  })
})
