const { promisify } = require('util')
const setImmediateP = promisify(setImmediate)

exports.exampleOperation = () => {
  let failing
  const operation = async () => {
    await setImmediateP()
    if (failing) {
      throw new Error('operation failed')
    }
    return 'success result'
  }
  operation.failing = () => { failing = true }
  operation.completing = () => { failing = false }
  return operation
}
