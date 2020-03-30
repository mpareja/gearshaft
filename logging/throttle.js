exports.throttleErrorLogging = (
  log, context, errorMessage, recoverMessage, fn,
  /* istanbul ignore next */ clock = () => new Date()
) => {
  let errorLoggedTs = null
  let errorCount = 0

  const tenSecondsSinceLastLogged = () => {
    const spanMs = clock() - errorLoggedTs // handles null
    return spanMs >= (10 * 1000)
  }

  return async (...args) => {
    let result
    try {
      result = await fn(...args)

      if (errorCount === 1) {
        log.info(context, recoverMessage)
      }
    } catch (err) {
      // only track errors inside 10s windows
      if (tenSecondsSinceLastLogged()) {
        errorCount = 1
        errorLoggedTs = clock()
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
