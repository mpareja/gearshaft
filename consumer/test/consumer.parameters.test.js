const createLog = require('../../test/test-log')
const { createConsumer } = require('../')
const { exampleMessageStore } = require('../../message-store')

describe('consumer', () => {
  it('exposes configuration parameters', () => {
    const consumer = createConsumer({
      log: createLog(),
      name: 'SomeConsumer',
      registerHandlers: () => {},
      messageStore: exampleMessageStore(),
      category: 'a-category',
      positionUpdateInterval: 321,
      correlation: 'a-correlation',
      identifier: 'an-identifier',
      groupMember: 1,
      groupSize: 3,
      pollingIntervalMs: 1234
    })

    expect(consumer).toMatchObject({
      name: 'SomeConsumer',
      category: 'a-category',
      positionUpdateInterval: 321,
      correlation: 'a-correlation',
      identifier: 'an-identifier',
      groupMember: 1,
      groupSize: 3,
      pollingIntervalMs: 1234
    })
  })
})
