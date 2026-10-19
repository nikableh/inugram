import { spawnSync } from 'node:child_process'
import { glob } from 'tinyglobby'
import { rootDir } from './config.js'

const files = await glob(['src/test/plugins/*.js', 'src/native/src/**/*.js'], { cwd: rootDir, absolute: true })
for (const file of files.sort()) {
  const result = spawnSync(process.execPath, ['--check', file], { stdio: 'inherit' })
  if (result.error) console.error(result.error.message)
  if (result.status !== 0) process.exit(result.status ?? 1)
}
