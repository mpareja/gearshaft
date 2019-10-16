const { follow } = require('../follow')
const { Metadata } = require('../metadata')
const {
  exampleMessage,
  exampleRandomValue
} = require('../examples')

class SomeMessage {}

describe('follow', () => {
  describe('metadata', () => {
    const previous = exampleMessage()
    const next = follow(previous, SomeMessage)

    it('next message metadata follows previous', () => {
      const expected = new Metadata()
      expected.follow(previous.metadata)
      expect(next.metadata).toEqual(expected)
    })
  })

  describe('message with simple top-level field', () => {
    const previous = exampleMessage()
    const next = follow(previous, SomeMessage)

    it('field is copied', () => {
      expect(next.someAttribute).toBe(previous.someAttribute)
    })

    it('id is not copied', () => {
      expect(next.id).toBe(null)
    })

    it('creates instance of desired type', () => {
      expect(next).toBeInstanceOf(SomeMessage)
    })
  })

  describe('message with nested field', () => {
    const previous = exampleMessage.nestedField()
    const next = follow(previous, SomeMessage)

    it('includes nested field', () => {
      expect(next.nested.netedField).toBe(previous.nested.netedField)
    })

    it('creates new parent object', () => {
      expect(next.nested).not.toBe(previous.nested)
    })
  })

  describe('message with array field', () => {
    const value = exampleRandomValue()
    const previous = exampleMessage()
    previous.some = {
      array: [{ value }],
      numArray: [1, 6, 12]
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

  describe('message with no metadata', () => {
    it('followed messages has new metadata ', () => {
      const previous = exampleMessage()
      delete previous.metadata
      const next = follow(previous, SomeMessage)

      expect(next.metadata).toBeDefined()
    })
  })
})
