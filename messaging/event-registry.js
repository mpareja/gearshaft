module.exports = () => {
  const handlers = []

  const register = (messageClass, handler) => {
    handlers.push([messageClass, handler])
  }

  const get = (message) => {
    const desiredClass = message.constructor
    const handler = handlers
      .filter(([messageClass]) => messageClass === desiredClass)
      .map(([_, handler]) => handler)[0]

    return handler
  }

  return { get, register }
}
