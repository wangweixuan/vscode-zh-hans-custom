// @ts-check

const { promises: fs } = require('fs')

/** @param {string} file */
async function parseJson(file) {
  const json = JSON.parse(await fs.readFile(file, 'utf8'))

  if (
    typeof json !== 'object' ||
    json === null ||
    json.version !== '1.0.0' ||
    typeof json.contents !== 'object'
  )
    throw new TypeError()

  return json.contents
}

/** @param {Record<string, Record<string, string>>} json */
function transformJson(json) {
  const ini = []

  if ('package' in json) {
    for (const field of Object.keys(json.package).sort())
      ini.push(`${field} = ${escapeValue(json.package[field])}`)
    ini[ini.length - 1] += '\n'
  }

  for (const block of Object.keys(json).sort()) {
    if (block === 'package') continue

    ini.push(`[${block}]`)

    for (const field of Object.keys(json[block]).sort())
      ini.push(`${field} = ${escapeValue(json[block][field])}`)

    ini[ini.length - 1] += '\n'
  }

  return ini.join('\n')
}

function transformJsonChange(change) {
  const ini = []

  for (const block of change) {
    ini.push(`# ${block.kind} block`)
    ini.push(`[${block.name}]`)

    switch (block.kind) {
      case 'Added':
        for (const field of Object.keys(block.fields).sort())
          ini.push(`${field} = ${escapeValue(block.fields[field])}`)
        break

      case 'Removed':
        for (const field of Object.keys(block.oldFields).sort()) {
          ini.push(`${field} = (field removed)`)
          ini.push(
            `# ${' '.repeat(field.length)} ${escapeValue(
              block.oldFields[field]
            )}`
          )
        }
        break

      case 'Modified':
        for (const field of block.fields) {
          switch (field.kind) {
            case 'Added':
              ini.push(`${field.name} = ${escapeValue(field.value)}`)
              break

            case 'Removed':
              ini.push(`${field.name} = (field removed)`)
              ini.push(
                `# ${' '.repeat(field.name.length)} ${escapeValue(
                  field.oldValue
                )}`
              )
              break

            case 'Modified':
              ini.push(`${field.name} = ${escapeValue(field.value)}`)
              ini.push(
                `# ${' '.repeat(field.name.length)} ${escapeValue(
                  field.oldValue
                )}`
              )
          }
        }
    }

    ini[ini.length - 1] += '\n'
  }

  return ini.join('\n')
}

/** @param {string} value */
function escapeValue(value) {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/\n/g, '\\n')
    .replace(/^ /, '\\s')
    .replace(/ $/, '\\s')
}

module.exports = { parseJson, transformJson, transformJsonChange }
