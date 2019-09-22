exports.cycle = function * (start, finish) {
  let i = start
  while (true) {
    yield i
    i = i >= finish ? start : i + 1
  }
}
