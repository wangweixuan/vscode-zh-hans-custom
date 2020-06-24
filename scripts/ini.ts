import { unescapeString } from './utilities'

export function parseIni(
  sections: Record<string, Record<string, string>>,
  content: string,
  file: string
) {
  const lines = content
    .split('\n')
    .map((line, count) => [line.trim(), count] as [string, number])

  let currentSection: Record<string, string> | undefined = undefined

  for (const [line, count] of lines) {
    if (!line.length || line.startsWith(';') || line.startsWith('#')) continue

    if (line.startsWith('[')) {
      if (!line.endsWith(']')) {
        throw new Error(`Missing end bracket in ${file}:${count + 1}.`)
      }

      const sectionName = line.slice(1, line.length - 1).trim()
      if (sectionName in sections) {
        throw new Error(`Duplicate section in ${file}:${count + 1}.`)
      }

      Object.defineProperty(sections, sectionName, {
        enumerable: true,
        value: {}
      })
      currentSection = sections[sectionName]
      continue
    }

    if (!currentSection) {
      throw new Error(`Missing section in ${file}:${count + 1}.`)
    }

    const separatorIndex = line.indexOf('=')
    if (separatorIndex === -1) {
      throw new Error(`Missing equal sign in ${file}:${count + 1}.`)
    }

    // TODO: escaping key is due to a ill-formatted key in typescript.ini
    const key = unescapeString(line.slice(0, separatorIndex).trimRight())
    if (key in currentSection) {
      throw new Error(`Duplicate field in ${file}:${count + 1}.`)
    }

    const value = unescapeString(line.slice(separatorIndex + 1))

    Object.defineProperty(currentSection, key, { enumerable: true, value })
  }
}
