const { createDocumentProjection } = require('../document-projection')
const { createEntityProjection } = require('../../entity-projection')
const { createLog } = require('../../logging')
const { createMemoryDocumentStore } = require('../../document-store/memory')
const { exampleMessage } = require('../../messaging')
const { uuid } = require('../../identifier')

const exampleDocumentProjection = (overrides) => {
  const fields = Object.assign({
    documentStore: createMemoryDocumentStore('basketId'),
    entity: FruitBasketView,
    identify: (message) => message.basketId,
    log: createLog(),
    projection: FruitBasketViewProjection
  }, overrides)

  return createDocumentProjection(fields)
}

const exampleManufactured = () => {
  const manufactured = exampleMessage(Manufactured)
  manufactured.basketId = uuid()
  return manufactured
}

class FruitBasketView {
  constructor () {
    this.fruit = []
  }

  manufactured ({ basketId }) {
    this.basketId = basketId
  }

  fruitAdded ({ type }) {
    this.fruit.push(type)
  }
}

class Manufactured {
  constructor (basketId) {
    this.basketId = basketId
  }
}

class FruitAdded {
  constructor (basketId, type) {
    this.basketId = basketId
    this.type = type
  }
}

const FruitBasketViewProjection = createEntityProjection((register) => {
  register(Manufactured, (basket, message) => basket.manufactured(message))
  register(FruitAdded, (basket, message) => basket.fruitAdded(message))
})

module.exports = {
  exampleDocumentProjection,
  exampleManufactured,
  FruitAdded,
  FruitBasketView,
  FruitBasketViewProjection,
  Manufactured
}
