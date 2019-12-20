const { getSystemInfo } = require('../system-info')

describe('system-info', () => {
  it('includes cpu information', async () => {
    const info = await getSystemInfo()

    expect(info.cpu).toBeDefined()
  })

  it('includes os information', async () => {
    const info = await getSystemInfo()

    expect(info.os).toBeDefined()
    expect(Object.keys(info.os)).toEqual([
      'platform',
      'distro',
      'release',
      'kernel',
      'arch',
      'servicepack'
    ])
  })

  it('includes node.js information', async () => {
    const info = await getSystemInfo()

    expect(info.node).toMatch(/^v.*/)
  })
})
