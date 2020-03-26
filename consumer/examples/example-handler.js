const setImmediateP = require('util').promisify(setImmediate)

const waitUntilCalledAtLeast = async (calls, times) => {
  while (calls.length < times) {
    await setImmediateP()
  }
}

exports.exampleHandler = () => {
  const calls = []

  const handler = (input) => { calls.push(input) }
  handler.calls = calls
  handler.waitUntilCalled = () => waitUntilCalledAtLeast(calls, 1)
  handler.waitUntilCalledAtLeast = waitUntilCalledAtLeast.bind(null, calls)

  return handler
}

exports.exampleHandlerBlocking = () => {
  const calls = []

  const handler = (input) => new Promise((resolve, reject) => {
    handler.resolve = resolve
    handler.reject = reject
    calls.push(input)
  })
  handler.calls = calls
  handler.waitUntilCalled = () => waitUntilCalledAtLeast(calls, 1)
  handler.waitUntilCalledAtLeast = waitUntilCalledAtLeast.bind(null, calls)

  return handler
}
