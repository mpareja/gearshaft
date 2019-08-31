exports.exampleHandler = () => {
  const calls = []
  const handler = (input) => { calls.push(input) }
  handler.calls = calls
  return handler
}
