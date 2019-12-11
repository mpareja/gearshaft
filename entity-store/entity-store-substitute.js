exports.createEntityStoreSubstitute = ({ entity: EntityClass }) => {
  const records = {}

  const add = (id, entity, version) => {
    records[id] = { entity, version }
  }

  const fetch = async (id) => {
    const [entity] = await fetchRecord(id)
    return entity
  }

  const fetchRecord = async (id) => {
    const record = records[id] || { entity: new EntityClass() }

    return [record.entity, record]
  }

  return { add, fetch, fetchRecord }
}
