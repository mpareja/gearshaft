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
    const meta = {
      streamName,
      position: messageData.position,
      globalPosition: messageData.globalPosition,
      type: messageData.type
    }

    try {
      await registry.handle(messageData)

      await updatePosition(messageData.globalPosition)
    } catch (err) {
      log.error({ ...meta, err }, err.message)
      throw err
    }

    log.info(meta, `${name} consumer: ${messageData.type} message dispatched to handlers`)
  }

  const updatePosition = async (globalPosition) => {
    positionUpdateCount++
    if (positionUpdateCount >= positionUpdateInterval) {
      try {
        await positionStore.put(globalPosition)
      } catch (inner) {
        throw consumerError('error updating consumer position', inner)
      }

      positionUpdateCount = 0
    }
  }

  return { dispatch, positionStore }
}
