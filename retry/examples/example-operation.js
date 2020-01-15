exports.exampleOperation = (overrides) => {
  const options = Object.assign({
    errorSchedule: []
  }, overrides)

  const operation = async () => {
    operation.calls++

    const error = options.errorSchedule.pop()
    if (error) {
      throw error
    }
  }

  operation.calls = 0

  return operation
}
