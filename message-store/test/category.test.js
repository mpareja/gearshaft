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
  describe('category', () => {
    it('returns the category name', () => {
      const category = createCategory(A_CATEGORY)

      expect(category.category).toBe(A_CATEGORY)
    })
  })

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
        expect(error.message).toBe('ID is required to create command stream name')
      })
    })

    describe('when id is undefined', () => {
      it('throws an error', () => {
        const category = createCategory(A_CATEGORY)

        const error = catchError(() => category.commandStreamName())

        expect(error).toBeDefined()
        expect(error).toBeInstanceOf(AssertionError)
        expect(error.message).toBe('ID is required to create command stream name')
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

  describe('entityStreamName', () => {
    describe('given types specified', () => {
      it('the specified types are included in the stream name', () => {
        const category = createCategory(A_CATEGORY)

        const types = ['other', 'thang']
        const streamName = category.entityStreamName(AN_ENTITY_ID, { types })

        expect(streamName).toBe('SomeCategory:other+thang-abc123')
      })
    })

    describe('given a type is specified', () => {
      it('the specified type is included in the stream name', () => {
        const category = createCategory(A_CATEGORY)

        const type = 'other'
        const streamName = category.entityStreamName(AN_ENTITY_ID, { type })

        expect(streamName).toBe('SomeCategory:other-abc123')
      })
    })

    describe('when id is null', () => {
      it('throws an error', () => {
        const category = createCategory(A_CATEGORY)

        const error = catchError(() => category.entityStreamName(null))

        expect(error).toBeDefined()
        expect(error).toBeInstanceOf(AssertionError)
        expect(error.message).toBe('ID is required to create entity stream name')
      })
    })

    describe('when id is undefined', () => {
      it('throws an error', () => {
        const category = createCategory(A_CATEGORY)

        const error = catchError(() => category.entityStreamName())

        expect(error).toBeDefined()
        expect(error).toBeInstanceOf(AssertionError)
        expect(error.message).toBe('ID is required to create entity stream name')
      })
    })
  })
})
