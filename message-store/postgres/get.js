const { createGetCategory } = require('./get/category')
const { createGetStream } = require('./get/stream')
const { StreamName } = require('../stream-name')

module.exports = ({ db, log, batchSize = 1000 }) => {
  const getCategory = createGetCategory({ db, log, batchSize })

  const getStream = createGetStream({ db, log, batchSize })

  const get = (streamName, options) => {
    const get = StreamName.isCategory(streamName)
      ? getCategory
      : getStream

    return get(streamName, options)
  }

  return { get, getCategory, getStream }
}
