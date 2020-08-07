const { StreamName } = require('./stream-name')

// read implementation offered to message-store implementations that
// retrieve messages in batches
module.exports = ({ batchSize = 1000, get }) => {
  const read = async function * (streamName, options = {}) {
    const localBatchSize = options.batchSize || batchSize

    let position = options.position

    let results
    do {
      results = await get(streamName, { batchSize: localBatchSize, ...options, position })
      for (const result of results) {
        position = StreamName.isCategory(streamName)
          ? result.globalPosition + 1
          : result.position + 1
        yield result
      }
    } while (results.length >= localBatchSize)
    // Results should't exceed batchSize in normal configuration
    // since get & read batchSize should be the same. Play it safe
    // with an inequality here in case the batchSizes _do_ differ
    // in some future / third-party message-store implementation.
  }
  return { read }
}
