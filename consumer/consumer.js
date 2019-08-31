const operationError = require('../errors/operation-error')
const { createConsumerHandlerRegistry } = require('./consumer-handler-registry')
const { createPositionStore } = require('./position-store')

exports.createConsumer = ({
  log,
  name,
  positionUpdateInterval = 100,
  registerHandlers,
  store,
  streamName,
  strict = false
}) => {
  const consumerError = operationError(`${name} consumer`)

  const positionStore = createPositionStore({ store, streamName })
  let positionUpdateCount = 0

  const registry = createConsumerHandlerRegistry({ name, log, strict })
  registerHandlers(registry.register)

  const dispatch = async (messageData) => {
    await registry.handle(messageData)

    positionUpdateCount++

    if (positionUpdateCount >= positionUpdateInterval) {
      try {
        await positionStore.put(messageData.globalPosition)
      } catch (inner) {
        throw consumerError('error updating consumer position', inner)
      }

      positionUpdateCount = 0
    }

    log.info({
      streamName,
      position: messageData.position,
      globalPosition: messageData.globalPosition,
      type: messageData.type
    }, `${name} consumer: ${messageData.type} message dispatched to handlers`)
  }

  return { dispatch, positionStore }
}
