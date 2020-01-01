import { promises as fs } from 'fs'
import { join, dirname } from 'path'
import { parseIni } from './ini'
import { relativeDot, MAPPINGS, HandledError, mkdir } from './utilities'

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
    const distPath = join(distDir, `${mappings.length}.json`)
    mappings.push([id, distPath])

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

    console.log('Writing:', relativeDot('', distPath))
    await fs.writeFile(
      distPath,
      JSON.stringify({
        version: '1.0.0',
        contents: sections
      })
    )

    console.groupEnd()
  }

  return mappings
}
