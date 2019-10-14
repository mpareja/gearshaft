const { convert, LocalDateTime } = require('js-joda')

exports.createFakeClock = () => {
  let current = LocalDateTime.now()

  const clock = () => convert(current).toDate()

  // bluntly copy methods for deriving new dates from current
  // so tests can use them to travel through time - i.e. clock.plusSeconds(10)
  for (const key of Object.keys(Object.getPrototypeOf(current))) {
    clock[key] = (...args) => {
      current = current[key](...args)
    }
  }

  return clock
}
