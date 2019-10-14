exports.throttleErrorLogging = (
  log, context, errorMessage, recoverMessage, fn,
  /* istanbul ignore next */ clock = () => new Date()
) => {
  let errorLoggedTs = null
  let errorCount = 0

  const tenSecondsSinceLastLogged = () => {
    const spanMs = clock() - errorLoggedTs
    return spanMs >= (10 * 1000)
  }

  return async (...args) => {
    let result
    try {
      result = await fn(...args)

      if (errorCount) {
        log.info({ errorCount, ...context }, recoverMessage)
      }
      errorLoggedTs = null
      errorCount = 0
    } catch (err) {
      errorCount++
      if (!errorLoggedTs || tenSecondsSinceLastLogged()) {
        errorLoggedTs = clock()
        log.error({ errorCount, ...context, err }, errorMessage)
      }

      throw err
    }

    return result
  }
}
