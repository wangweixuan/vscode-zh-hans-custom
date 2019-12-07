// @ts-check

const { promises: fs } = require('fs')
const { join } = require('path')
const { parseIni } = require('./ini-to-json')
const { parseJson } = require('./json-to-ini')
const { transformJson, transformJsonChange } = require('./json-to-ini')
const {
  CATEGORIES,
  INI_FILES,
  SRC_DIR,
  UPSTREAM_NEW_FILES,
  UPSTREAM_NEW_DIR,
  UPSTREAM_CHANGES_HORI_DIR
} = require('./paths')

async function compare() {
  try {
    await fs.access(UPSTREAM_CHANGES_HORI_DIR)
  } catch (err) {
    await fs.mkdir(UPSTREAM_CHANGES_HORI_DIR)
  }
  for (const category of CATEGORIES)
    try {
      await fs.access(join(UPSTREAM_CHANGES_HORI_DIR, category))
    } catch (err) {
      await fs.mkdir(join(UPSTREAM_CHANGES_HORI_DIR, category))
    }

  for (const file of await compareWorkspace()) {
    switch (file.kind) {
      case 'Added':
        console.log(`Added file: ${join(file.file)}`)

        await fs.writeFile(
          join(UPSTREAM_CHANGES_HORI_DIR, `${file.file}.ini`),
          transformJson(file.blocks),
          'utf8'
        )

        break

      case 'Removed':
        console.log(`Removed file: ${join(file.category, file.file)}`)

        break

      case 'Modified':
        console.log(`Modified file: ${join(file.category, file.file)}`)

        await fs.writeFile(
          join(UPSTREAM_CHANGES_HORI_DIR, file.category, `${file.file}.ini`),
          transformJsonChange(file.blocks),
          'utf8'
        )
    }
  }
}

async function compareWorkspace() {
  const change = []

  for (const category of CATEGORIES)
    for (const file of INI_FILES[category])
      if (!UPSTREAM_NEW_FILES.includes(file))
        change.push({
          kind: 'Removed',
          category,
          file
        })

  for (const file of UPSTREAM_NEW_FILES) {
    const category = CATEGORIES.find(item => INI_FILES[item].includes(file))

    if (!category) {
      change.push({
        kind: 'Added',
        file,
        blocks: await parseJson(join(UPSTREAM_NEW_DIR, `${file}.i18n.json`))
      })
      continue
    }

    const fileChange = await compareFile(
      await parseIni(join(SRC_DIR, category, `${file}.ini`)),
      await parseJson(join(UPSTREAM_NEW_DIR, `${file}.i18n.json`))
    )

    if (fileChange.length)
      change.push({
        kind: 'Modified',
        category,
        file,
        blocks: fileChange
      })
  }

  return change
}

async function compareFile(oldFile, newFile) {
  const change = []

  for (const block of Object.keys(oldFile))
    if (!(block in newFile))
      change.push({
        kind: 'Removed',
        name: block,
        oldFields: oldFile[block]
      })

  for (const block of Object.keys(newFile)) {
    if (block.startsWith('win32/i18n')) continue

    if (!(block in oldFile)) {
      change.push({
        kind: 'Added',
        name: block,
        fields: newFile[block]
      })
      continue
    }

    const blockChange = compareBlock(oldFile[block], newFile[block])

    if (blockChange.length)
      change.push({
        kind: 'Modified',
        name: block,
        fields: blockChange
      })
  }

  return change.sort((a, b) => (a.name > b.name ? 1 : -1))
}

function compareBlock(oldBlock, newBlock) {
  const change = []

  for (const field of Object.keys(oldBlock))
    if (!(field in newBlock))
      change.push({
        kind: 'Removed',
        name: field,
        oldValue: oldBlock[field]
      })

  for (const field of Object.keys(newBlock)) {
    if (!(field in oldBlock)) {
      change.push({
        kind: 'Added',
        name: field,
        value: newBlock[field]
      })
      continue
    }
  }

  return change.sort((a, b) => (a.name > b.name ? 1 : -1))
}

compare()
