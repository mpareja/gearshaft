const fs = require('fs')
const { basename, dirname, resolve } = require('path')
const { promisify } = require('util')

const globalWriteFile = promisify(fs.writeFile)

exports.writeStatsFile = async (script, stats, writeFile) => {
  /* istanbul ignore next */
  writeFile = writeFile || globalWriteFile

  const scriptDirectory = dirname(script)
  const benchmarkName = basename(script).replace(/\.benchmark\.js$/, '').replace(/\.js$/, '')
  const dateSlug = stats.date.toISOString().substring(0, 19).replace(/:/g, '-')
  const file = resolve(scriptDirectory, 'results', `${benchmarkName}-${dateSlug}.results.json`)

  await writeFile(file, JSON.stringify(stats, null, '  '))
}
