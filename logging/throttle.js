exports.throttleErrorLogging = (
  log, context, errorMessage, recoverMessage, fn,
  /* istanbul ignore next */ clock = () => new Date()
) => {
  let errorLoggedTs = null
  let errorCount = 0
  let recoveryCount = 0

  const tenSecondsSinceLastLogged = () => {
    const spanMs = clock() - errorLoggedTs // handles null
    return spanMs >= (10 * 1000)
  }

  return async (...args) => {
    let result
    try {
      result = await fn(...args)

      if (errorCount > 0 && recoveryCount === 0) {
        recoveryCount++
        log.warn(context, recoverMessage)
      }
    } catch (err) {
      // only track errors inside 10s windows
      if (tenSecondsSinceLastLogged()) {
        errorCount = 1
        errorLoggedTs = clock()
        recoveryCount = 0
      } else {
        errorCount++
      }

      if (errorCount === 1) {
        log.error({ ...context, err }, errorMessage)
      } else if (errorCount === 2) {
        log.error({ ...context, err }, errorMessage + ' (logging suppressed for next 10s)')
      }

      throw err
    }

    return result
  }
}
