// @ts-check

const { promises: fs } = require('fs')

/**
 * Reads and parses specified translation file.
 * @param {string} file Absolute path to the input file.
 */
async function parseIni(file) {
  const content = await fs.readFile(file, 'utf8')
  const lines = content.split('\n').map(line => line.trim())

  const result = {}

  let section = undefined

  for (const line of lines) {
    if (!line.length || line.startsWith(';') || line.startsWith('#')) continue

    if (line.startsWith('[')) {
      if (!line.endsWith(']'))
        throw new Error(
          `Missing end bracket in ${file}:${lines.indexOf(line)}.`
        )

      const newSection = line.slice(1, line.length - 1).trim()
      if (newSection in result)
        throw new Error(`Duplicate section in ${file}:${lines.indexOf(line)}.`)

      Object.defineProperty(result, newSection, { enumerable: true, value: {} })
      section = result[newSection]
      continue
    }

    const separatorIndex = line.indexOf('=')
    if (separatorIndex === -1)
      throw new Error(`Missing equal sign in ${file}:${lines.indexOf(line)}.`)

    const key = line.slice(0, separatorIndex).trimRight()
    if (key in section)
      throw new Error(`Duplicate property in ${file}:${lines.indexOf(line)}.`)

    const value = unescapeValue(line.slice(separatorIndex + 1))

    Object.defineProperty(section, key, { enumerable: true, value })
  }

  return result
}

/** @param {string} value */
function unescapeValue(value) {
  return value
    .trim()
    .replace(/\\\\/g, 'I_AM_A_BACKSLASH')
    .replace(/\\n/g, '\n')
    .replace(/\\s/g, ' ')
    .replace(/\\t/g, '\t')
    .replace(/I_AM_A_BACKSLASH/g, '\\')
}

module.exports = { parseIni }
