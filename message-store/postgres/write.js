module.exports = ({ db, log, put }) => {
  const write = async (data, streamName, expectedVersion) => {
    const messages = Array.isArray(data) ? data : [data]
    const info = {
      count: messages.length,
      expectedVersion,
      streamName,
      types: messages.map(m => m.type)
    }

    log.debug(info, 'message-store write: starting')

    // optimization: skip transaction if not required
    const position = messages.length === 1
      ? await put(messages[0], streamName, expectedVersion)
      : await writeMessages(messages, streamName, expectedVersion)

    log.info({ ...info, position }, 'message-store write: successful')

    return position
  }

  const writeMessages = async (messages, streamName, expectedVersion) => {
    let position
    await db.transaction(async (txdb) => {
      for (const message of messages) {
        position = await put(message, streamName, expectedVersion, txdb)

        if (typeof expectedVersion === 'number') {
          expectedVersion += 1
        }
      }
    })
    return position
  }

  return { write }
}
