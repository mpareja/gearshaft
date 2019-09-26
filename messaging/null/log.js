/* istanbul ignore next */
exports.createNullLog = () => {
  const log = { info: () => {}, warn: () => {}, error: () => {}, debug: () => {} }
  return log
}
