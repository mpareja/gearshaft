const { createGetCategory } = require('./get/category')
const { createGetStream } = require('./get/stream')
const { StreamName } = require('../stream-name')

module.exports = ({ db, log, batchSize = 1000 }) => {
  const getCategory = createGetCategory({ db, log, batchSize })

  const getStream = createGetStream({ db, log, batchSize })

  const get = (streamName, position) => {
    const get = StreamName.isCategory(streamName)
      ? getCategory
      : getStream

    return get(streamName, position)
  }

  return { get }
}
