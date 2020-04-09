class Recorded {
  static create (position) {
    const instance = new Recorded()
    instance.position = position
    return instance
  }
}
module.exports = { Recorded }
