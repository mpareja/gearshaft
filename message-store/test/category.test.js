const { AssertionError } = require('assert')
const { createCategory } = require('../category')

const A_CATEGORY = 'SomeCategory'
const AN_ENTITY_ID = 'abc123'

const catchError = (fn) => {
  try {
    fn()
  } catch (error) {
    return error
  }
}

describe('category', () => {
  describe('commandStreamName', () => {
    describe('given no types specified', () => {
      it('adds "command" type to stream name', () => {
        const category = createCategory(A_CATEGORY)

        const streamName = category.commandStreamName(AN_ENTITY_ID)

        expect(streamName).toBe('SomeCategory:command-abc123')
      })
    })

    describe('given types specified', () => {
      it('adds "command" and the specified types to stream name', () => {
        const category = createCategory(A_CATEGORY)

        const types = ['other', 'thang']
        const streamName = category.commandStreamName(AN_ENTITY_ID, { types })

        expect(streamName).toBe('SomeCategory:command+other+thang-abc123')
      })
    })

    describe('given a type is specified', () => {
      it('adds "command" and the specified type to stream name', () => {
        const category = createCategory(A_CATEGORY)

        const type = 'other'
        const streamName = category.commandStreamName(AN_ENTITY_ID, { type })

        expect(streamName).toBe('SomeCategory:command+other-abc123')
      })
    })

    describe('when id is null', () => {
      it('throws an error', () => {
        const category = createCategory(A_CATEGORY)

        const error = catchError(() => category.commandStreamName(null))

        expect(error).toBeDefined()
        expect(error).toBeInstanceOf(AssertionError)
        expect(error.message).toBe('ID is required to create a command stream name')
      })
    })

    describe('when id is undefined', () => {
      it('throws an error', () => {
        const category = createCategory(A_CATEGORY)

        const error = catchError(() => category.commandStreamName())

        expect(error).toBeDefined()
        expect(error).toBeInstanceOf(AssertionError)
        expect(error.message).toBe('ID is required to create a command stream name')
      })
    })
  })

  describe('commandCategory', () => {
    describe('no other types specified', () => {
      it('returns category with just command type added', () => {
        const category = createCategory(A_CATEGORY)

        const commandCategory = category.commandCategory()

        expect(commandCategory).toBe('SomeCategory:command')
      })
    })

    describe('given types specified', () => {
      it('adds "command" and the specified types to category name', () => {
        const category = createCategory(A_CATEGORY)

        const types = ['other', 'thang']
        const streamName = category.commandCategory({ types })

        expect(streamName).toBe('SomeCategory:command+other+thang')
      })
    })

    describe('given a type is specified', () => {
      it('adds "command" and the specified type to category name', () => {
        const category = createCategory(A_CATEGORY)

        const type = 'other'
        const streamName = category.commandCategory({ type })

        expect(streamName).toBe('SomeCategory:command+other')
      })
    })
  })
})
