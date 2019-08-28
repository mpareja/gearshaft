const { createPositionStore } = require('../position-store')
const { exampleMessageStore } = require('../../message-store/examples')

exports.examplePositionStore = ({ store, ...args } = {}) => {
  store = store || exampleMessageStore()
  return createPositionStore({ ...args, store })
}
