const { startHost } = require('../')
const { EventEmitter } = require('events')
const { exampleConsumer } = require('../examples')

describe('host', () => {
  describe('upon registering a component', () => {
    it('starts the component', () => {
      const consumer = exampleConsumer()

      startHost(host => {
        host.register(consumer)
      })

      expect(consumer.started).toBe(true)
      expect(consumer.runner.stats().stopped).toBe(false)
    })
  })

  const setupSignalReceived = (signal) => {
    const consumer = exampleConsumer()
    const systemProcess = new EventEmitter()

    startHost(host => {
      host.register(consumer)
    }, systemProcess)

    systemProcess.emit(signal)

    return { consumer, systemProcess }
  }

  describe('upon receiving SIGCONT', () => {
    it('resumes the stopped component', () => {
      const { consumer, systemProcess } = setupSignalReceived('SIGTSTP')
      systemProcess.emit('SIGCONT')

      expect(consumer.runner.stats().paused).toBe(false)
    })
  })

  describe('upon receiving SIGINT', () => {
    it('stops the component', () => {
      const { consumer } = setupSignalReceived('SIGINT')

      expect(consumer.runner.stats().stopped).toBe(true)
    })
  })

  describe('upon receiving SIGTERM', () => {
    it('stops the components', () => {
      const { consumer } = setupSignalReceived('SIGTERM')

      expect(consumer.runner.stats().stopped).toBe(true)
    })
  })

  describe('upon receiving SIGTSTP', () => {
    it('resumes the stopped component', () => {
      const { consumer } = setupSignalReceived('SIGTSTP')

      expect(consumer.runner.stats().paused).toBe(true)
    })
  })
})
