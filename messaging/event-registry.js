module.exports.createEventRegistry = () => {
  const handlers = []

  const register = (messageClass, handler) => {
    handlers.push([messageClass, handler])
  }

  const get = (className) => {
    const found = handlers
      .filter(([aClass]) => aClass.name === className)[0] || []

    const [messageClass, handler] = found

    return { messageClass, handler }
  }

  return { get, register }
}
