const { startHost } = require('../')
const { EventEmitter } = require('events')
const { exampleConsumer } = require('../examples')

const setImmediateP = require('util').promisify(setImmediate)

describe('host', () => {
  const setupHostWithConsumer = () => {
    const consumer = exampleConsumer()
    const systemProcess = new EventEmitter()

    const host = startHost(host => {
      host.register(consumer)
    }, systemProcess)

    return { consumer, host, systemProcess }
  }

  describe('upon registering a consumer', () => {
    it('starts the consumer', () => {
      const { consumer } = setupHostWithConsumer()

      expect(consumer.started).toBe(true)
      expect(consumer.runner.stats().paused).toBe(false)
      expect(consumer.runner.stats().stopped).toBe(false)
    })
  })

  describe('stop', () => {
    it('stops the consumer', () => {
      const { consumer, host } = setupHostWithConsumer()

      host.stop()

      expect(consumer.runner.stats().stopped).toBe(true)
    })

    it('forwards stopping arguments to runners', () => {
      const { consumer, host } = setupHostWithConsumer()
      consumer.runner.stop = jest.fn(consumer.runner.stop)

      host.stop('bob')

      expect(consumer.runner.stop).toHaveBeenCalledWith('bob')
    })

    it('emits "stopped" event', async () => {
      const { host } = setupHostWithConsumer()
      const stopped = jest.fn()
      host.once('stopped', stopped)

      await host.stop()

      expect(stopped).toHaveBeenCalled()
    })

    describe('given an active task', () => {
      it('awaits completion of active task', async () => {
        const { consumer, host } = setupHostWithConsumer()

        // start active task
        consumer.runner.trigger('blockedTask')
        await setImmediateP()

        // commence stopping
        const stopPromise = host.stop()

        // task is still blocked
        expect(consumer.runner.stats().active).toBe(1)

        setTimeout(() => {
          consumer.runner.tasks.blockedTask.unblock()
        }, 5)

        await stopPromise

        expect(consumer.runner.stats().active).toBe(0)
      })
    })
  })

  describe('pause', () => {
    it('pauses the consumer', () => {
      const { consumer, host } = setupHostWithConsumer()

      host.pause()

      expect(consumer.runner.stats().paused).toBe(true)
    })

    it('forwards pausing arguments to runners', () => {
      const { consumer, host } = setupHostWithConsumer()
      consumer.runner.pause = jest.fn(consumer.runner.pause)

      host.pause('bob')

      expect(consumer.runner.pause).toHaveBeenCalledWith('bob')
    })

    it('emits "paused" event', async () => {
      const { host } = setupHostWithConsumer()
      const paused = jest.fn()
      host.once('paused', paused)

      await host.pause()

      expect(paused).toHaveBeenCalled()
    })

    describe('given an active task', () => {
      it('awaits completion of active task', async () => {
        const { consumer, host } = setupHostWithConsumer()

        // start active task
        consumer.runner.trigger('blockedTask')
        await setImmediateP()

        // commence stopping
        const pausePromise = host.pause()

        // task is still blocked
        expect(consumer.runner.stats().active).toBe(1)

        setTimeout(() => {
          consumer.runner.tasks.blockedTask.unblock()
        }, 5)

        await pausePromise

        expect(consumer.runner.stats().active).toBe(0)
      })
    })
  })

  describe('unpausing a paused host', () => {
    it('unpauses the consumer', () => {
      const { consumer, host } = setupHostWithConsumer()

      host.pause()
      host.unpause()

      expect(consumer.runner.stats().paused).toBe(false)
    })

    it('forwards unpausing arguments to runners', () => {
      const { consumer, host } = setupHostWithConsumer()
      consumer.runner.unpause = jest.fn(consumer.runner.unpause)

      host.pause()
      host.unpause('bob')

      expect(consumer.runner.unpause).toHaveBeenCalledWith('bob')
    })

    it('emits "unpaused" event', async () => {
      const { host } = setupHostWithConsumer()
      const unpaused = jest.fn()
      host.once('unpaused', unpaused)

      await host.pause()
      await host.unpause()

      expect(unpaused).toHaveBeenCalled()
    })
  })

  describe('process signals', () => {
    const setupSignalReceived = (signal) => {
      const scenario = setupHostWithConsumer()

      scenario.systemProcess.emit(signal)

      return scenario
    }

    describe('upon receiving SIGCONT', () => {
      it('resumes the stopped consumer', () => {
        const { consumer, systemProcess } = setupSignalReceived('SIGTSTP')
        systemProcess.emit('SIGCONT')

        expect(consumer.runner.stats().paused).toBe(false)
      })
    })

    describe('upon receiving SIGINT', () => {
      it('stops the consumer', () => {
        const { consumer } = setupSignalReceived('SIGINT')

        expect(consumer.runner.stats().stopped).toBe(true)
      })
    })

    describe('upon receiving SIGTERM', () => {
      it('stops the consumers', () => {
        const { consumer } = setupSignalReceived('SIGTERM')

        expect(consumer.runner.stats().stopped).toBe(true)
      })
    })

    describe('upon receiving SIGTSTP', () => {
      it('resumes the stopped consumer', () => {
        const { consumer } = setupSignalReceived('SIGTSTP')

        expect(consumer.runner.stats().paused).toBe(true)
      })
    })
  })
})
