module.exports = () => {
  const handlers = []

  const register = (messageClass, handler) => {
    handlers.push([messageClass, handler])
  }

  const get = (messageData) => {
    const { type } = messageData
    const found = handlers
      .filter(([aClass]) => aClass.name === type)[0] || []

    const [messageClass, handler] = found

    return { messageClass, handler }
  }

  return { get, register }
}
