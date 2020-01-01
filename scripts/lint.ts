import { promises as fs } from 'fs'
import { join, dirname } from 'path'
import { parseIni } from './ini'
import { relativeDot, HandledError } from './utilities'
import { jsonToIni } from './json'

export async function lint(catalogPath: string) {
  const catalog: Readonly<Record<string, readonly string[]>> = JSON.parse(
    await fs.readFile(catalogPath, 'utf8')
  )
  const linted: string[] = []

  for (const id of Object.keys(catalog)) {
    for (const file of catalog[id]) {
      const sourcePath = join(dirname(catalogPath), file)

      if (linted.includes(sourcePath))
        continue
      linted.push(sourcePath)
      console.log('Linting:', relativeDot('', sourcePath))

      const contents = await fs.readFile(sourcePath, 'utf8')
      const sections: Record<string, Record<string, string>> = {}
      try {
        parseIni(sections, contents, relativeDot('', sourcePath))
      } catch (err) {
        console.log('Parsing failed:', err.message)

        throw new HandledError(err)
      }

      await fs.writeFile(sourcePath, jsonToIni(sections))
    }
  }
}