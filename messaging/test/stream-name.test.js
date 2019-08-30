const { exampleStreamName } = require('../examples')
const { StreamName } = require('../stream-name')

const A_CATEGORY = 'someCategory'
const AN_ID = 'some_id'

describe('stream-name', () => {
  describe('with category no id', () => {
    const name = StreamName.create(A_CATEGORY)

    it('stream name is the category', () => {
      expect(name).toEqual(A_CATEGORY)
    })

    it('getCategory returns the category name', () => {
      expect(StreamName.getCategory(name)).toBe(A_CATEGORY)
    })

    it('is not a category stream', () => {
      expect(StreamName.isCategory(name)).toBe(true)
    })

    it('types list is empty', () => {
      expect(StreamName.getTypes(name)).toEqual([])
    })

    it('entity name is the category', () => {
      expect(StreamName.getEntityName(name)).toBe(A_CATEGORY)
    })

    it('id is null', () => {
      expect(StreamName.getId(name)).toBe(null)
    })
  })

  describe('with category and id', () => {
    const name = StreamName.create(A_CATEGORY, AN_ID)

    it('stream name is the category and the id', () => {
      expect(name).toEqual('someCategory-some_id')
    })

    it('getCategory returns the category name', () => {
      expect(StreamName.getCategory(name)).toBe(A_CATEGORY)
    })

    it('is not a category stream', () => {
      expect(StreamName.isCategory(name)).toBe(false)
    })

    it('entity name is the category', () => {
      expect(StreamName.getEntityName(name)).toBe(A_CATEGORY)
    })

    it('id is the part of stream name before the first dash', () => {
      expect(StreamName.getId(name)).toBe(AN_ID)
    })
  })

  describe('with category and type', () => {
    const name = StreamName.create(A_CATEGORY, { type: 'someType' })

    it('stream name is the category and the Type', () => {
      expect(name).toEqual('someCategory:someType')
    })

    it('getCategory returns the category name and types', () => {
      expect(StreamName.getCategory(name)).toBe('someCategory:someType')
    })

    it('types list contains the single type', () => {
      expect(StreamName.getTypes(name)).toEqual(['someType'])
    })

    it('entity name is the category', () => {
      expect(StreamName.getEntityName(name)).toBe(A_CATEGORY)
    })
  })

  describe('with category and types', () => {
    const name = StreamName.create('someCategory', { types: ['someType', 'someOtherType'] })

    it('stream name is the category and the types delimited by the plus (+) sign', () => {
      expect(name).toEqual('someCategory:someType+someOtherType')
    })

    it('getCategory returns the category name and types', () => {
      expect(StreamName.getCategory(name)).toBe('someCategory:someType+someOtherType')
    })

    it('types list contains all the types', () => {
      expect(StreamName.getTypes(name)).toEqual(['someType', 'someOtherType'])
    })

    it('entity name is the category', () => {
      expect(StreamName.getEntityName(name)).toBe(A_CATEGORY)
    })

    it('id is null', () => {
      expect(StreamName.getId(name)).toBe(null)
    })
  })

  describe('with category, type and types', () => {
    const name = StreamName.create('someCategory', { type: 'someType', types: ['someOtherType', 'yetAnotherYet'] })

    it('stream name is the category and the types delimited by the plus (+) sign', () => {
      expect(name).toEqual('someCategory:someType+someOtherType+yetAnotherYet')
    })
  })

  describe('with category, type, types and id', () => {
    const name = StreamName.create('someCategory', AN_ID, { type: 'someType', types: ['someOtherType', 'yetAnotherYet'] })

    it('stream name is the category and the types delimited by the plus (+) sign', () => {
      expect(name).toEqual('someCategory:someType+someOtherType+yetAnotherYet-some_id')
    })

    it('getCategory returns the category name and types but no id', () => {
      expect(StreamName.getCategory(name)).toEqual(
        'someCategory:someType+someOtherType+yetAnotherYet')
    })

    it('entity name is the category', () => {
      expect(StreamName.getEntityName(name)).toBe(A_CATEGORY)
    })
  })

  describe('examples', () => {
    describe('no category', () => {
      it('category is test + random bytes + XX', () => {
        const name = exampleStreamName()
        expect(StreamName.getCategory(name)).toMatch(/^test.{32}XX/)
      })
    })

    describe('with category', () => {
      it('category is as stated', () => {
        const name = exampleStreamName('bob')
        expect(StreamName.getCategory(name)).toMatch('bob')
      })
    })

    describe('with category and randomize option', () => {
      it('category is as stated + random bytes + XX', () => {
        const name = exampleStreamName('bogus', { randomize: true })
        expect(StreamName.getCategory(name)).toMatch(/^bogus.{32}XX/)
      })
    })

    describe('with category, id and randomize option', () => {
      const name = exampleStreamName('bogus', AN_ID, { randomize: true })

      it('category is as stated + random bytes + XX', () => {
        expect(StreamName.getCategory(name)).toMatch(/^bogus.{32}XX/)
      })

      it('id is as stated', () => {
        expect(StreamName.getId(name)).toEqual(AN_ID)
      })
    })
  })
})
