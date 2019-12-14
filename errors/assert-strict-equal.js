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
