const assert = require('assert')

class StreamName {
  static create (category, id, extra = {}) {
    assert(typeof category === 'string')

    if (id && typeof id === 'object') {
      extra = id
      id = null
    }

    const allTypes = Array.isArray(extra.types) ? extra.types : []
    if (extra.type) {
      allTypes.unshift(extra.type)
    }

    let name = category
    if (allTypes.length) { name += `:${allTypes.join('+')}` }
    if (id) { name += `-${id}` }
    return name
  }

  static getCategory (name) {
    return name.split('-')[0]
  }

  static getEntityName (name) {
    return StreamName.getCategory(name).split(':')[0]
  }

  static getId (name) {
    const split = name.split('-')
    return split.length > 1 ? split[split.length - 1] : null
  }

  static getTypes (name) {
    const typeString = StreamName.getTypeList(name)
    return typeString === null ? [] : typeString.split('+')
  }

  static getTypeList (name) {
    const typeString = name.split(':').pop().split('-')[0]

    return name.indexOf(typeString) === 0 ? null : typeString
  }

  static isCategory (name) {
    return name.indexOf('-') >= 0
  }
}

module.exports = StreamName
