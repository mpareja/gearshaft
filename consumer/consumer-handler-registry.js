const operationError = require('../errors/operation-error')
const { createEventRegistry, fromReadMessageData } = require('../messaging')

exports.createConsumerHandlerRegistry = ({ name, log, registerHandlers, strict }) => {
  const consumerError = operationError(`${name} consumer`)
  const registry = createEventRegistry()

  const handle = async (messageData) => {
    const { id, type } = messageData
    const meta = { consumerName: name, messageId: id, messageType: type }

    const { handler, messageClass } = registry.get(messageData)

    if (handler) {
      log.debug({ ...meta, payload: messageData }, `${name} consumer: start handling ${type} message`)

      const message = fromReadMessageData(messageData, messageClass)
      await handler(message)

      log.info(meta, `${name} consumer: handled ${type} message`)
    } else {
      if (strict) {
        throw consumerError(`${messageData.type} handler not found for strict consumer ${name}`)
      }

      log.info(meta, `${name} consumer: ignored ${type} message`)
    }
  }

  return { handle, register: registry.register }
}
