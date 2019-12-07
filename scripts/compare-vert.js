// @ts-check

const { promises: fs } = require('fs')
const { join } = require('path')
const { parseJson } = require('./json-to-ini')
const { transformJson, transformJsonChange } = require('./json-to-ini')
const {
  UPSTREAM_NEW_FILES,
  UPSTREAM_OLD_FILES,
  UPSTREAM_NEW_DIR,
  UPSTREAM_OLD_DIR,
  UPSTREAM_CHANGES_VERT_DIR
} = require('./paths')

async function compare() {
  try {
    await fs.access(UPSTREAM_CHANGES_VERT_DIR)
  } catch (err) {
    await fs.mkdir(UPSTREAM_CHANGES_VERT_DIR)
  }

  for (const file of await compareWorkspace()) {
    switch (file.kind) {
      case 'Added':
        console.log(`Added file: ${file.file}`)

        await fs.writeFile(
          join(UPSTREAM_CHANGES_VERT_DIR, `${file.file}.ini`),
          transformJson(file.blocks),
          'utf8'
        )

        break

      case 'Removed':
        console.log(`Removed file: ${file.file}`)

        break

      case 'Modified':
        console.log(`Modified file: ${file.file}`)

        await fs.writeFile(
          join(UPSTREAM_CHANGES_VERT_DIR, `${file.file}.ini`),
          transformJsonChange(file.blocks),
          'utf8'
        )
    }
  }
}

async function compareWorkspace() {
  const change = []

  for (const file of UPSTREAM_OLD_FILES)
    if (!UPSTREAM_NEW_FILES.includes(file))
      change.push({
        kind: 'Removed',
        file
      })

  for (const file of UPSTREAM_NEW_FILES) {
    if (!UPSTREAM_OLD_FILES.includes(file)) {
      change.push({
        kind: 'Added',
        file,
        blocks: await parseJson(join(UPSTREAM_NEW_DIR, `${file}.i18n.json`))
      })
      continue
    }

    const fileChange = await compareFile(
      await parseJson(join(UPSTREAM_OLD_DIR, `${file}.i18n.json`)),
      await parseJson(join(UPSTREAM_NEW_DIR, `${file}.i18n.json`))
    )

    if (fileChange.length)
      change.push({
        kind: 'Modified',
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

    if (newBlock[field] !== oldBlock[field])
      change.push({
        kind: 'Modified',
        name: field,
        value: newBlock[field],
        oldValue: oldBlock[field]
      })
  }

  return change.sort((a, b) => (a.name > b.name ? 1 : -1))
}

compare()
