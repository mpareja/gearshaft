const cloneDeep = require('lodash.clonedeep')
const { Metadata } = require('./metadata')

exports.follow = (previous, ClassOfNext) => {
  const data = cloneDeep(previous)
  const next = new ClassOfNext()
  Object.assign(next, data)

  next.id = null

  next.metadata = new Metadata()
  next.metadata.follow(previous.metadata)

  return next
}
