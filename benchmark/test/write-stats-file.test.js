const { exampleStats, exampleStatsFile } = require('../examples')
const { writeStatsFile } = require('../write-stats-file')

describe('write-stats-file', () => {
  it('writes results to the expected location', async () => {
    const stats = exampleStats()
    const writeFile = jest.fn()

    writeStatsFile('/some/dir/some-widget.benchmark.js', stats, writeFile)

    expect(writeFile).toHaveBeenCalledWith(
      '/some/dir/results/some-widget-2019-09-22T12-45-59.results.json',
      expect.any(String)
    )
  })

  it('formats the file as JSON with 2-space indentation', async () => {
    const stats = exampleStats()
    const writeFile = jest.fn()

    writeStatsFile('/some/dir/some-widget.benchmark.js', stats, writeFile)

    expect(writeFile).toHaveBeenCalledWith(
      expect.any(String),
      exampleStatsFile()
    )
  })
})
