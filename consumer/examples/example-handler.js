exports.exampleHandler = () => {
  const calls = []
  const handler = (input) => { calls.push(input) }
  handler.calls = calls
  return handler
}

exports.exampleHandlerBlocking = () => {
  const handler = (input) => new Promise((resolve, reject) => {
    handler.resolve = resolve
    handler.reject = reject
  })

  return handler
}
