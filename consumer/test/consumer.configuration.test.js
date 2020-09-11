const createLog = require('../../test/test-log')
const { AssertionError } = require('assert')
const { catchError } = require('../../errors')
const { createConsumer } = require('../')
const { exampleCategory, exampleMessageStore } = require('../../message-store')

const setupConsumer = (overrides) => {
  const fields = Object.assign({
    log: createLog(),
    name: 'SomeConsumer',
    registerHandlers: () => {},
    messageStore: exampleMessageStore(),
    category: exampleCategory()
  }, overrides)

  return createConsumer(fields)
}

describe('consumer configuration', () => {
  it('requires settings', () => {
    const error = catchError(() => createConsumer())

    expect(error).toBeInstanceOf(AssertionError)
    expect(error.message).toBe('consumer: options required')
  })

  it('requires log', () => {
    const error = catchError(() => setupConsumer({ log: null }))

    expect(error).toBeInstanceOf(AssertionError)
    expect(error.message).toBe('consumer: log required')
  })

  it('requires name', () => {
    const error = catchError(() => setupConsumer({ name: null }))

    expect(error).toBeInstanceOf(AssertionError)
    expect(error.message).toBe('consumer: name required')
  })

  it('requires registerHandlers', () => {
    const error = catchError(() => setupConsumer({ registerHandlers: null }))

    expect(error).toBeInstanceOf(AssertionError)
    expect(error.message).toBe('consumer: registerHandlers required')
  })

  it('requires messageStore', () => {
    const error = catchError(() => setupConsumer({ messageStore: null }))

    expect(error).toBeInstanceOf(AssertionError)
    expect(error.message).toBe('consumer: messageStore required')
  })

  it('requires category', () => {
    const error = catchError(() => setupConsumer({ category: null }))

    expect(error).toBeInstanceOf(AssertionError)
    expect(error.message).toBe('consumer: category required')
  })

  it('allows identifier without consumer group settings', () => {
    setupConsumer({ identifier: 'some-identifier' })
  })

  describe('consumer groups', () => {
    const setupConsumerGroup = (overrides) => {
      return setupConsumer(Object.assign({
        groupMember: 0,
        groupSize: 2,
        identifier: 'some-identifier'
      }, overrides))
    }

    it('requires identifier', () => {
      const error = catchError(() => setupConsumerGroup({
        identifier: null
      }))

      expect(error).toBeInstanceOf(AssertionError)
      expect(error.message).toBe('consumer: groupMember, groupSize, and identifier required for consumer groups')
    })

    it('requires groupMember', () => {
      const error = catchError(() => setupConsumerGroup({
        groupMember: null
      }))

      expect(error).toBeInstanceOf(AssertionError)
      expect(error.message).toBe('consumer: groupMember, groupSize, and identifier required for consumer groups')
    })

    it('requires groupSize', () => {
      const error = catchError(() => setupConsumerGroup({
        groupSize: null
      }))

      expect(error).toBeInstanceOf(AssertionError)
      expect(error.message).toBe('consumer: groupMember, groupSize, and identifier required for consumer groups')
    })
  })
})
