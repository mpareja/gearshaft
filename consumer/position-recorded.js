class PositionRecorded {
  static create (position) {
    const instance = new PositionRecorded()
    instance.position = position
    return instance
  }
}
exports.PositionRecorded = PositionRecorded
