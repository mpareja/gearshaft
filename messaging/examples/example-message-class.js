const { exampleRandomValue } = require('./example-random-value')

module.exports.exampleMessageClass = (className) => {
  className = className || `AnExampleMessage_${exampleRandomValue()}`
  let theClass

  // dynamically generate a class
  // eslint-disable-next-line no-eval
  eval(`
    class ${className} {}
    theClass = ${className}
  `)

  return theClass
}
