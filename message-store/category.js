const { AssertionError } = require('assert')
const { StreamName } = require('./stream-name')

exports.createCategory = (category) => {
  const commandStreamName = (id, extra = {}) => {
    if (id === null || id === undefined) {
      throw new AssertionError({
        message: 'ID is required to create a command stream name',
        actual: id,
        stackStartFn: commandStreamName
      })
    }

    const types = extra.types || []
    if (extra.type) {
      types.unshift(extra.type)
    }
    types.unshift('command')

    return StreamName.create(category, id, { types })
  }

  return { commandStreamName }
}
