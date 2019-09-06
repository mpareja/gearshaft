const setImmediateP = require('util').promisify(setImmediate)

exports.exampleHandler = () => {
  const calls = []
  const handler = (input) => { calls.push(input) }
  handler.calls = calls
  return handler
}

exports.exampleHandlerBlocking = () => {
  const calls = []
  const handler = (input) => new Promise((resolve, reject) => {
    handler.resolve = resolve
    handler.reject = reject
    calls.push(input)
  })

  handler.waitUntilCalled = () => {
    return handler.waitUntilCalledAtLeast(1)
  }
  handler.waitUntilCalledAtLeast = async (times) => {
    while (handler.calls.length < times) {
      await setImmediateP()
    }
  }
  handler.calls = calls

  return handler
}
