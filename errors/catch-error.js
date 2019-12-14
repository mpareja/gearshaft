exports.catchError = (fn) => {
  try {
    fn()
  } catch (error) {
    return error
  }
}
