const { cycle } = require('../')

describe('cycle', () => {
  it('returns cycle using iterator', () => {
    const result = []
    let count = 0
    for (const i of cycle(1, 3)) {
      count++
      result.push(i)
      if (count >= 7) {
        break
      }
    }

    expect(result).toEqual([1, 2, 3, 1, 2, 3, 1])
  })
})
