import { build } from './build'
import { join, resolve } from 'path'
import { PROJECT_ROOT, HandledError } from './utilities'
import { updatePackage } from './package'
import { compare } from './compare'
import { lint } from './lint'

async function main(args: string[]) {
  switch (args[0]) {
    case 'build':
      if (args.length !== 1) {
        console.error('Error: "build" command expects no arguments.')
        process.exit(1)
      }

      try {
        const mappings = await build(
          join(PROJECT_ROOT, 'src/catalog.json'),
          join(PROJECT_ROOT, 'dist')
        )
        await updatePackage(join(PROJECT_ROOT, 'package.json'), mappings)

      } catch (err) {
        if (!(err instanceof HandledError)) console.error(err.toString())
        process.exit(1)
      }
      process.exit()

    case 'compare':
      if (args.length !== 3) {
        console.error('Error: "compare" command expects 2 arguments.')
        process.exit(1)
      }

      await compare(
        resolve(args[1], 'package.json'),
        resolve(args[2], 'package.json'),
        join(PROJECT_ROOT, 'upstream/diff')
      )
      process.exit()

    case 'lint':
      if (args.length !== 1) {
        console.error('Error: "lint" command expects no arguments.')
        process.exit(1)
      }

      await lint(join(PROJECT_ROOT, 'src/catalog.json'))
      process.exit()

    case undefined:
      console.log('Error: No command.')
      process.exit(1)

    default:
      console.log('Error: Unknown command.')
      process.exit(1)
  }
}

main(process.argv.slice(2))
