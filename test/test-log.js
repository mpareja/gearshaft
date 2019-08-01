module.exports = () => {
  const log = { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() }

  log.enableDebugging = /* istanbul ignore next */ () => {
    for (const key of Object.keys(log).filter(k => k !== 'enableDebugging')) {
      log[key].mockImplementation((...args) => {
        console.log(`${key.toUpperCase()}:`, args)
      })
    }
  }
  return log
}
