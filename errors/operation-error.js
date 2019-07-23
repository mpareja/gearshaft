module.exports = (operationName) => (detail, inner) => {
  const error = new Error(`${operationName}: ${detail}`)
  if (inner) {
    error.inner = inner
  }
  return error
}
