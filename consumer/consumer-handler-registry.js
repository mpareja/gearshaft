const operationError = require('../errors/operation-error')
const { createEventRegistry, fromReadMessageData } = require('../messaging')

exports.createConsumerHandlerRegistry = ({ name, log, registerHandlers, strict }) => {
  const consumerError = operationError(`${name} consumer`)
  const registry = createEventRegistry()

  const register = (messageClass, handler) => {
    if (handler.length !== 1) {
      throw consumerError('invalid handler, function must accept 1 parameter')
    }
    registry.register(messageClass, handler)
  }

  const handle = async (messageData) => {
    const { id, streamName, type } = messageData
    const meta = { consumerName: name, messageId: id, messageType: type, streamName }

    const { handler, messageClass } = registry.get(messageData)

    if (handler) {
      log.debug({ ...meta, payload: messageData }, `${name} consumer: start dispatching ${type} message`)

      const message = fromReadMessageData(messageData, messageClass)

      try {
        await handler(message)
      } catch (inner) {
        const message = `${messageData.type} handler raised an error`
        const error = consumerError(message, inner)
        log.error({ ...meta, err: inner }, `${name} consumer: ${message}`)
        throw error
      }

      log.info(meta, `${name} consumer: dispatched ${type} message`)
    } else {
      if (strict) {
        throw consumerError(`${messageData.type} handler not found for strict consumer ${name}`)
      }

      log.info(meta, `${name} consumer: ignored ${type} message`)
    }
  }

  return { handle, register }
}
