exports.asyncIterableToArray = async (iterable) => {
  const results = []
  for await (const result of iterable) {
    results.push(result)
  }
  return results
}
