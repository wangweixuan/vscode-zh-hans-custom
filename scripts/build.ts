import { promises as fs } from 'fs'
import { join, dirname } from 'path'
import { parseIni } from './ini'
import { relativeDot, MAPPINGS, HandledError, mkdir } from './utilities'
import { createHash } from 'crypto'

export async function build(
  catalogPath: string,
  distDir: string
): Promise<MAPPINGS> {
  await mkdir(distDir)

  const catalog: Readonly<Record<string, readonly string[]>> = JSON.parse(
    await fs.readFile(catalogPath, 'utf8')
  )
  const mappings: [string, string][] = []

  for (const id of Object.keys(catalog)) {
    console.group('Building:', id)

    const sections: Record<string, Record<string, string>> = {}

    for (const file of catalog[id]) {
      const sourcePath = join(dirname(catalogPath), file)

      console.log('Parsing:', relativeDot('', sourcePath))

      const contents = await fs.readFile(sourcePath, 'utf8')
      try {
        parseIni(sections, contents, relativeDot('', sourcePath))

      } catch (err) {
        console.log('Parsing failed:', err.message)

        throw new HandledError(err)
      }
    }

    const contents = JSON.stringify({
      version: '1.0.0',
      contents: sections
    })

    const hash = createHash('sha1')
      .update(contents)
      .digest('hex')
      .substring(0, 7)
    const distPath = join(distDir, `${hash}.json`)
    mappings.push([id, distPath])

    console.log('Writing:', relativeDot('', distPath))
    await fs.writeFile(distPath, contents)

    console.groupEnd()
  }

  return mappings
}
