const cloneDeep = require('lodash.clonedeep')
const { Metadata } = require('./metadata')

exports.follow = (previous, ClassOfNext, additionalFields) => {
  const data = Object.assign(cloneDeep(previous), additionalFields)

  let next
  if (ClassOfNext.create) {
    next = ClassOfNext.create(data)
  } else {
    next = new ClassOfNext()
    Object.assign(next, data)
  }

  next.id = null

  next.metadata = new Metadata()
  next.metadata.follow(previous.metadata)

  return next
}
