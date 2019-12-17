const { StreamName } = require('./stream-name')

module.exports = ({ batchSize, get }) => {
  const read = async function * (streamName, { position } = {}) {
    let results
    do {
      results = await get(streamName, position)
      for (const result of results) {
        position = StreamName.isCategory(streamName)
          ? result.globalPosition + 1
          : result.position + 1
        yield result
      }
    } while (results.length >= batchSize)
    // Results should't exceed batchSize in normal configuration
    // since get & read batchSize should be the same. Play it safe
    // with an inequality here in case the batchSizes _do_ differ
    // in some future / third-party message-store implementation.
  }
  return { read }
}
