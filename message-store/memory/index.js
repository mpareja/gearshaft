module.exports = () => {
  const streams = {}

  const read = async function * (streamName, position) {
    position = position || 0
    const stream = streams[streamName] || []
    const subset = stream.slice(position)

    for (const message of subset) {
      yield message
    }
  }

  const write = (msgOrBatch, streamName) => {
    let stream = streams[streamName]
    if (!stream) {
      stream = []
      streams[streamName] = stream
    }

    const batch = Array.isArray(msgOrBatch) ? msgOrBatch : [msgOrBatch]
    for (const message of batch) {
      stream.push(message)
    }
  }

  return { read, write }
}
