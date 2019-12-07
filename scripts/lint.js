// @ts-check

const { promises: fs } = require('fs')
const { join } = require('path')
const { parseIni } = require('./ini-to-json')
const { transformJson } = require('./json-to-ini')
const { INI_FILES, CATEGORIES, SRC_DIR } = require('./paths')

async function lint() {
  for (const category of CATEGORIES)
    for (const file of INI_FILES[category]) {
      console.log(`Linting: ${join(category, file)}`)

      const path = join(SRC_DIR, category, `${file}.ini`)
      await fs.writeFile(path, transformJson(await parseIni(path)))
    }
}

lint()
