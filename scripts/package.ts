import { promises as fs } from 'fs'
import { relative, join, dirname } from 'path'
import { relativeDot, MAPPINGS } from './utilities'

export async function readPackage(packagePath: string): Promise<MAPPINGS> {
  const contents = JSON.parse(await fs.readFile(packagePath, 'utf8'))

  return (contents.contributes.localizations[0].translations as {
    id: string
    path: string
  }[]).map(({ id, path }) => [id, join(dirname(packagePath), path)])
}

export async function updatePackage(packagePath: string, mappings: MAPPINGS) {
  console.log('Updating:', relativeDot('', packagePath))

  const contents = JSON.parse(await fs.readFile(packagePath, 'utf8'))

  contents.contributes.localizations[0].translations = mappings.map(
    ([id, path]) => ({
      id,
      path: relative(dirname(packagePath), path)
    })
  )

  await fs.writeFile(packagePath, JSON.stringify(contents, undefined, 2) + '\n')
}
