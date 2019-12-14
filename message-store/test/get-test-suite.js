const createLog = require('../../test/test-log')
const { exampleCategory, exampleStreamName } = require('../examples')

exports.generateGetSuite = ({
  createMessageStore
}) => {
  describe('get', () => {
    let messageStore, log
    beforeEach(async () => {
      log = createLog()
      messageStore = createMessageStore({ log })
    })

    it('can request stream', async () => {
      const streamName = exampleStreamName()

      await messageStore.get(streamName)
    })

    it('can request category', async () => {
      const category = exampleCategory()

      await messageStore.get(category)
    })
  })
}
