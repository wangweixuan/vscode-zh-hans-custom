import { escapeString } from './utilities'

export function parseJson(
  content: string
): Record<string, Record<string, string>> {
  const json = JSON.parse(content)

  if (
    typeof json !== 'object' ||
    json === null ||
    json.version !== '1.0.0' ||
    typeof json.contents !== 'object'
  )
    throw new TypeError()

  return json.contents
}

export function jsonToIni(content: Record<string, Record<string, string>>) {
  const result: string[] = []

  for (const sectionName of Object.keys(content).sort()) {
    result.push(`[${sectionName}]`)
    const section = content[sectionName]

    for (const field of Object.keys(section).sort())
      result.push(`${field} = ${escapeString(section[field])}`)

    result.push('')
  }

  return result.join('\n')
}
