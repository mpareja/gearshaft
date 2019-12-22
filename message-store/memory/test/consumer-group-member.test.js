const { assignIdToMember } = require('../consumer-group-member')

describe('consumer-group-member', () => {
  describe('assignIdToMember', () => {
    describe('matches message-db algorithm', () => {
      [
        ['A', 2, 0],
        ['C', 2, 1],
        ['687c3cfa79c7c79ce506078951f0b752', 2, 1] // -1 case
      ].forEach(([id, size, expectedMember]) => {
        it(`${id} -> ${expectedMember} for size ${size}`, () => {
          const member = assignIdToMember(id, size)

          expect(member).toBe(expectedMember)
        })
      })
    })
  })
})
