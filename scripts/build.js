// @ts-check

const { promises: fs } = require('fs')
const { join } = require('path')
const { parseIni } = require('./ini-to-json')
const { CATEGORIES, DIST_DIR, INI_FILES, SRC_DIR } = require('./paths')

/** Compiles all INI translation files into JSON files. */
async function build() {
  try {
    await fs.access(DIST_DIR)
  } catch (err) {
    await fs.mkdir(DIST_DIR)
  }

  for (const category of CATEGORIES)
    for (const file of INI_FILES[category]) {
      console.log(`Building: ${join(category, file)}`)

      await fs.writeFile(
        join(DIST_DIR, `${file}.json`),
        JSON.stringify({
          version: '1.0.0',
          contents: await parseIni(join(SRC_DIR, category, `${file}.ini`))
        }),
        'utf8'
      )
    }
}

build()
