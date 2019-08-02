module.exports = () => {
  const handlers = []

  const register = (messageClass, handler) => {
    handlers.push([messageClass, handler])
  }

  const get = (message) => {
    const messageClass = message.constructor
    const handler = handlers
      .filter(([aClass]) => aClass === messageClass)
      .map(([_, handler]) => handler)[0]

    return { handler, messageClass }
  }

  return { get, register }
}
