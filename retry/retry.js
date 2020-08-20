// future opportunities (based on cockatiel/polly):
// retry({ errorTypes: [], returnTypes: [], errorFilter: () => {}, returnFilter: () => {} }, fn)
exports.retry = async (errorTypes, operation) => {
  const isRetryType = (error) => errorTypes.some(type => error instanceof type)

  while (true) {
    try {
      return await operation()
    } catch (err) {
      if (!isRetryType(err)) {
        throw err
      }
    }
  }
}
