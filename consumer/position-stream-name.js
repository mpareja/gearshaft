const { StreamName } = require('../message-store')
const TYPE = 'position'

exports.getPositionStreamName = (streamName, consumerId) => {
  const entity = StreamName.getEntityName(streamName)

  const sourceId = StreamName.getId(streamName)
  let id = sourceId
  if (consumerId) {
    id = sourceId ? `${sourceId}-${consumerId}` : consumerId
  }

  const types = StreamName.getTypes(streamName)
  if (!types.some(t => t === TYPE)) {
    types.push('position')
  }

  return StreamName.create(entity, id, { types })
}
