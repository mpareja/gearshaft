exports.deserialize = (row) => {
  return {
    id: row.id,
    streamName: row.stream_name,
    type: row.type,
    position: row.position,
    globalPosition: row.global_position,
    data: JSON.parse(row.data),
    metadata: JSON.parse(row.metadata),
    time: new Date(row.time)
  }
}
