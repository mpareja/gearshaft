const { AssertionError } = require('assert')

exports.assertStrictEqual = (actual, expected, stackStartFn, message) => {
  if (actual !== expected) {
    throw new AssertionError({
      message,
      expected,
      actual,
      stackStartFn
    })
  }
}

exports.assertTruthy = (actual, stackStartFn, message) => {
  if (!message) {
    throw new AssertionError({
      message: 'error message is required'
    })
  }
  if (!actual) {
    throw new AssertionError({
      message,
      actual,
      stackStartFn
    })
  }
}
