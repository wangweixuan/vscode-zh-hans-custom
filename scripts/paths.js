// @ts-check

const { readdirSync } = require('fs')
const { basename, join } = require('path')

const SRC_DIR = join(__dirname, '../src')
const DIST_DIR = join(__dirname, '../dist')
const UPSTREAM_NEW_DIR = join(__dirname, '../upstream/new')
const UPSTREAM_OLD_DIR = join(__dirname, '../upstream/old')
const UPSTREAM_CHANGES_HORI_DIR = join(__dirname, '../upstream/changes-hori')
const UPSTREAM_CHANGES_VERT_DIR = join(__dirname, '../upstream/changes-vert')

const CATEGORIES = readdirSync(SRC_DIR, { withFileTypes: true })
  .filter(dirent => dirent.isDirectory())
  .map(dirent => dirent.name)

const INI_FILES = {}

for (const category of CATEGORIES)
  Object.defineProperty(INI_FILES, category, {
    enumerable: true,
    value: readdirSync(join(SRC_DIR, category)).map(file =>
      basename(file, '.ini')
    )
  })

const UPSTREAM_NEW_FILES = readdirSync(UPSTREAM_NEW_DIR).map(file =>
  basename(file, '.i18n.json')
)
const UPSTREAM_OLD_FILES = readdirSync(UPSTREAM_OLD_DIR).map(file =>
  basename(file, '.i18n.json')
)

module.exports = {
  CATEGORIES,
  DIST_DIR,
  INI_FILES,
  SRC_DIR,
  UPSTREAM_CHANGES_HORI_DIR,
  UPSTREAM_CHANGES_VERT_DIR,
  UPSTREAM_NEW_DIR,
  UPSTREAM_NEW_FILES,
  UPSTREAM_OLD_DIR,
  UPSTREAM_OLD_FILES
}
