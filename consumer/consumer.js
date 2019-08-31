const { createConsumerHandlerRegistry } = require('./consumer-handler-registry')
exports.createConsumer = ({ name, log, registerHandlers, streamName, strict }) => {
  const registry = createConsumerHandlerRegistry({ name, log, strict })
  registerHandlers(registry.register)

  const dispatch = async (messageData) => {
    await registry.handle(messageData)

    log.info({
      streamName,
      position: messageData.position,
      globalPosition: messageData.globalPosition,
      type: messageData.type
    }, `${name} consumer: ${messageData.type} message dispatched to handlers`)
  }

  return { dispatch }
}
