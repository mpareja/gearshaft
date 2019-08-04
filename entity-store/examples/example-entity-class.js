class ExampleEntityClass {
  constructor () {
    this.applied = []
  }

  note (method, message) {
    this.applied.push({ method, id: message.id })
  }

  methodA (message) {
    this.note('methodA', message)
  }

  methodB (message) {
    this.note('methodB', message)
  }

  get someMessagesApplied () {
    return this.applied.length > 0
  }
}

module.exports.ExampleEntityClass = ExampleEntityClass
