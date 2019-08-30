const { follow } = require('../follow')
const { Metadata } = require('../metadata')
const {
  exampleMessageMetadata,
  exampleRandomValue
} = require('../examples')

class SomeMessage {}

describe('follow', () => {
  describe('metadata', () => {
    const previous = { metadata: exampleMessageMetadata() }
    const next = follow(previous, SomeMessage)

    it('next message metadata follows previous', () => {
      const expected = new Metadata()
      expected.follow(previous.metadata)
      expect(next.metadata).toEqual(expected)
    })
  })

  describe('message with simple top-level field', () => {
    const someField = exampleRandomValue()
    const previous = { someField, metadata: exampleMessageMetadata() }
    const next = follow(previous, SomeMessage)

    it('field is copied', () => {
      expect(next.someField).toBe(someField)
    })

    it('creates instance of desired type', () => {
      expect(next).toBeInstanceOf(SomeMessage)
    })
  })

  describe('message with nested field', () => {
    const value = exampleRandomValue()
    const previous = {
      metadata: exampleMessageMetadata(),
      parent: { child: value }
    }
    const next = follow(previous, SomeMessage)

    it('includes nested field', () => {
      expect(next.parent.child).toBe(previous.parent.child)
    })

    it('creates new parent object', () => {
      expect(next.parent).not.toBe(previous.parent)
    })
  })

  describe('message with array field', () => {
    const value = exampleRandomValue()
    const previous = {
      metadata: exampleMessageMetadata(),
      some: {
        array: [{ value }],
        numArray: [1, 6, 12]
      }
    }
    const next = follow(previous, SomeMessage)

    it('includes array field', () => {
      expect(next.some.array).toHaveLength(1)
      expect(next.some.array[0].value).toEqual(value)
    })

    it('creates new array object', () => {
      expect(next.some.array).not.toBe(previous.some.array)
    })

    it('includes number fields', () => {
      expect(next.some.numArray).toEqual(previous.some.numArray)
    })
  })
})
