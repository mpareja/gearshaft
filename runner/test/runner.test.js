const { createRunner, exampleRunner } = require('../')
const { promisify } = require('util')
const setImmediateP = promisify(setImmediate)
const delay = promisify(setTimeout)

const NO_PARAMETERS = []

const setupRunBlockedTask = async () => {
  const runner = exampleRunner()

  runner.trigger('blockedTask')

  await setImmediateP()

  const { unblock } = runner.tasks.blockedTask
  return { runner, unblock }
}

describe('trigger', () => {
  describe('triggering a task without parameters', () => {
    it('runs the task with no parameters', async () => {
      const runner = exampleRunner()

      runner.trigger('task')

      await setImmediateP()

      expect(runner.tasks.task.calls).toHaveLength(1)
      expect(runner.tasks.task.calls[0]).toEqual(NO_PARAMETERS)
    })
  })

  describe('triggering a task with parameters', () => {
    it('runs the task with supplied parameters', async () => {
      const runner = exampleRunner()

      const some = 'value'
      const other = 'values'
      runner.trigger('task', some, other)

      await setImmediateP()

      expect(runner.tasks.task.calls).toEqual([
        [some, other]
      ])
    })
  })

  describe('triggering a sync task', () => {
    it('runs the task on a different tick of the event loop', async () => {
      let done = false
      const tasks = { syncTask: () => { done = true } }
      const runner = createRunner({ tasks })

      runner.trigger('syncTask')

      expect(done).toBe(false)

      await setImmediateP()

      expect(done).toBe(true)
      expect(runner.stats().active).toBe(0)
    })
  })
})

describe('stats', () => {
  describe('given no tasks triggered', () => {
    it('active tasks is 0', () => {
      const runner = exampleRunner()

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
      const runner = exampleRunner()

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
      const runner = exampleRunner()

      runner.pause()
      runner.trigger('task')

      expect(runner.tasks.task.calls).toHaveLength(0)
    })
  })

  describe('unpausing after tasks were triggered while paused', () => {
    it('runs the previously triggered tasks in order', async () => {
      const runner = exampleRunner()
      runner.pause()
      runner.trigger('task', 'first')
      runner.trigger('task', 'second')

      runner.unpause()

      await setImmediateP()

      expect(runner.tasks.task.calls).toEqual([
        ['first'],
        ['second']
      ])
    })
  })

  describe('unpausing multiple times', () => {
    it('does not retrigger previously paused tasks', async () => {
      const runner = exampleRunner()
      runner.pause()
      runner.trigger('task')

      runner.unpause()
      runner.unpause()

      expect(runner.tasks.task.calls).toHaveLength(1)
    })
  })

  describe('given a long running task', () => {
    it('pause waits and resolves once task is complete', async () => {
      const { runner } = await setupRunBlockedTask()

      let paused = false
      runner.pause().then(() => { paused = true })

      // give task opportunity to start and block
      await delay(10)

      expect(paused).toBe(false)

      // unblock and expect pause to complete on next tick
      runner.tasks.blockedTask.unblock()
      await setImmediateP()

      expect(paused).toBe(true)
    })
  })

  describe('triggering task and pausing runner on the same event loop tick', () => {
    it('pauses runner once task is complete', async () => {
      const runner = exampleRunner()

      runner.trigger('blockedTask')

      let paused = false
      runner.pause().then(() => { paused = true })

      // give task opportunity to start and block
      await delay(10)

      expect(paused).toBe(false)

      // unblock and expect pause to complete on next tick
      runner.tasks.blockedTask.unblock()
      await setImmediateP()

      expect(paused).toBe(true)
    })
  })
})

describe('stop', () => {
  describe('given a long running task', () => {
    it('stop waits and resolves once task is complete', async () => {
      const { runner, unblock } = await setupRunBlockedTask()

      let stopped = false
      runner.stop().then(() => { stopped = true })

      // give task opportunity to start and block
      await delay(10)

      expect(stopped).toBe(false)

      // unblock and expect stop to complete on next tick
      unblock()
      await setImmediateP()

      expect(stopped).toBe(true)
    })
  })

  describe('triggering a task on a stopped runner', () => {
    it('does not run the task', () => {
      const runner = exampleRunner()

      runner.stop()
      runner.trigger('task')

      expect(runner.tasks.task.calls).toHaveLength(0)
    })
  })

  describe('triggering task and stopping runner on the same event loop tick', () => {
    it('stops runner once task is complete', async () => {
      const runner = exampleRunner()

      runner.trigger('blockedTask')

      let stopped = false
      runner.stop().then(() => { stopped = true })

      // give task opportunity to start and block
      await delay(10)

      expect(stopped).toBe(false)

      // unblock and expect stop to complete on next tick
      runner.tasks.blockedTask.unblock()
      await setImmediateP()

      expect(stopped).toBe(true)
    })
  })

  describe('unpausing a stopped runner', () => {
    it('does not run queued tasks', () => {
      const runner = exampleRunner()

      runner.pause()
      runner.trigger('task')
      runner.stop()

      runner.unpause()

      expect(runner.tasks.task.calls).toHaveLength(0)
    })
  })
})
