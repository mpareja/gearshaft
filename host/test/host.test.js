const { startHost } = require('../')
const { EventEmitter } = require('events')
const { exampleConsumer } = require('../examples')

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

  describe('stopping the host', () => {
    it('stops the consumer', () => {
      const { consumer, host } = setupHostWithConsumer()

      host.stop()

      expect(consumer.runner.stats().stopped).toBe(true)
    })
  })

  describe('pausing the host', () => {
    it('pauses the consumer', () => {
      const { consumer, host } = setupHostWithConsumer()

      host.pause()

      expect(consumer.runner.stats().paused).toBe(true)
    })
  })

  describe('unpausing a paused host', () => {
    it('unpauses the consumer', () => {
      const { consumer, host } = setupHostWithConsumer()

      host.pause()
      host.unpause()

      expect(consumer.runner.stats().paused).toBe(false)
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
