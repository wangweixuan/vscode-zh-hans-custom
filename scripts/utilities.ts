import { join, relative } from 'path'
import { promises as fs } from 'fs'

export const PROJECT_ROOT = join(__dirname, '..')
export type MAPPINGS = [string, string][]

export class HandledError extends Error {}

export function relativeDot(from: string, to: string) {
  const result = relative(from, to)
  return result.startsWith('/') ||
    result.startsWith('./') ||
    result.startsWith('../')
    ? result
    : `./${result}`
}

export async function mkdir(dir: string) {
  try {
    fs.mkdir(dir, { recursive: true })
  } catch (err) {
    if (err.code === 'EEXIST') return

    throw err
  }
}

export function escapeString(value: string) {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/\n/g, '\\n')
    .replace(/^ /, '\\s')
    .replace(/ $/, '\\s')
}

export function unescapeString(value: string) {
  return value
    .trim()
    .replace(/\\\\/g, 'I_AM_A_BACKSLASH')
    .replace(/\\n/g, '\n')
    .replace(/\\s/g, ' ')
    .replace(/\\t/g, '\t')
    .replace(/I_AM_A_BACKSLASH/g, '\\')
}
