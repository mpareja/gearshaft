module.exports = (operationName) => (detail, inner) => {
  const error = new Error(`${operationName}: ${detail}`)
  if (inner) {
    error.inner = inner
  }

  Error.captureStackTrace(error, module.exports)

  return error
}
