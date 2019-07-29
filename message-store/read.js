module.exports = ({ batchSize, get }) => {
  const read = async function * (streamName, position) {
    let results
    do {
      results = await get(streamName, position)
      for (const result of results) {
        position = result.position + 1
        yield result
      }
    } while (results.length >= batchSize)
  }
  return { read }
}
