const { AssertionError } = require('assert')
const { StreamName } = require('./stream-name')

exports.createCategory = (category) => {
  const commandCategory = (extra = {}) => {
    const types = extra.types || []
    if (extra.type) {
      types.unshift(extra.type)
    }
    types.unshift('command')

    return StreamName.create(category, { types })
  }

  const commandStreamName = (id, extra = {}) => {
    assertId(commandStreamName, 'command', id)

    const types = extra.types || []
    if (extra.type) {
      types.unshift(extra.type)
    }
    types.unshift('command')

    return StreamName.create(category, id, { types })
  }

  const entityStreamName = (id, extra) => {
    assertId(commandStreamName, 'entity', id)

    return StreamName.create(category, id, extra)
  }

  const assertId = (stackStartFn, streamType, id) => {
    if (id === null || id === undefined) {
      throw new AssertionError({
        message: `ID is required to create ${streamType} stream name`,
        actual: id,
        stackStartFn: commandStreamName
      })
    }
  }

  return { commandCategory, commandStreamName, entityStreamName }
}
