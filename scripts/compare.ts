import { promises as fs } from 'fs'
import { readPackage } from './package'
import { escapeString, mkdir } from './utilities'
import { parseJson, jsonToIni } from './json'
import { join } from 'path'

export async function compare(
  oldPackagePath: string,
  newPackagePath: string,
  distDir: string
) {
  await mkdir(distDir)

  const oldMappings = await readPackage(oldPackagePath)
  const newMappings = await readPackage(newPackagePath)

  for (const [id, path] of oldMappings) {
    if (newMappings.some(([newId]) => id === newId)) continue

    console.log('Removed:', id)
  }

  for (const [id, path] of newMappings) {
    const old = oldMappings.find(([oldId]) => id === oldId)

    if (!old) {
      console.log('Added:', id)

      const result = jsonToIni(parseJson(await fs.readFile(path, 'utf8')))
      await fs.writeFile(join(distDir, `${id}.ini`), result)

      continue
    }

    const result = await compareFile(old[1], path)
    if (!result) continue

    console.log('Modified:', id)
    await fs.writeFile(join(distDir, `${id}.ini`), result)
  }
}

async function compareFile(oldPath: string, newPath: string) {
  const oldSections = parseJson(await fs.readFile(oldPath, 'utf8'))
  const newSections = parseJson(await fs.readFile(newPath, 'utf8'))
  const result: string[] = []

  for (const sectionName of Object.keys(oldSections).sort()) {
    if (sectionName in newSections) continue

    result.push('# Removed section', `[${sectionName}]`)

    const section = oldSections[sectionName]
    for (const field of Object.keys(section).sort())
      result.push(`${field} = ${escapeString(section[field])}`)

    result.push('')
    continue
  }

  for (const sectionName of Object.keys(newSections).sort()) {
    if (sectionName.startsWith('win32')) continue

    if (!(sectionName in oldSections)) {
      result.push('# Added section', `[${sectionName}]`)

      const section = newSections[sectionName]
      for (const field of Object.keys(section).sort())
        result.push(`${field} = ${escapeString(section[field])}`)

      result.push('')
      continue
    }

    const sectionResult = compareSection(
      sectionName,
      oldSections[sectionName],
      newSections[sectionName]
    )
    if (sectionResult) result.push(sectionResult, '')
  }

  return result.length ? result.join('\n') : undefined
}

function compareSection(
  sectionName: string,
  oldSection: Record<string, string>,
  newSection: Record<string, string>
) {
  const result: string[] = ['# Modified section', `[${sectionName}]`]

  for (const field of Object.keys(oldSection).sort()) {
    if (field in newSection) continue

    result.push(
      '# Removed field',
      `${field} = ${escapeString(oldSection[field])}`
    )
  }

  for (const field of Object.keys(newSection).sort()) {
    if (!(field in oldSection)) {
      result.push(
        '# Added field',
        `${field} = ${escapeString(newSection[field])}`
      )

      continue
    }
  }

  return result.length === 2 ? undefined : result.join('\n')
}
