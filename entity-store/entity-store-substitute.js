exports.createEntityStoreSubstitute = ({ entity: EntityClass }) => {
  const records = {}

  const add = (id, entity, version) => {
    records[id] = { entity, metadata: { version } }
  }

  const fetch = async (id) => {
    const [entity] = await fetchRecord(id)
    return entity
  }

  const fetchRecord = async (id) => {
    const record = records[id] || { entity: new EntityClass(), metadata: { version: -1 } }

    return [record.entity, record.metadata]
  }

  return { add, fetch, fetchRecord }
}
