const { createEventRegistry } = require('../messaging')

exports.createEntityProjection = (registerHandlers) => {
  const registry = createEventRegistry()
  registerHandlers(registry.register)

  const project = (entity, ...messages) => {
    for (const message of messages) {
      projectMessage(entity, message)
    }
  }

  const projectMessage = (entity, message) => {
    const { name } = message.constructor

    const { handler } = registry.get(name)

    if (handler) {
      handler(entity, message)
    }
  }

  return { project, registerHandlers }
}
