import { spawnSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { rootDir } from './config.js'

const args = process.argv.slice(2)
const pluginless = args[0] === '--pluginless'
if (pluginless) args.shift()
const worktreeDir = join(rootDir, pluginless ? 'worktree-pluginless' : 'worktree')

if (!existsSync(worktreeDir)) {
  throw new Error(`Missing ${worktreeDir}; run pnpm run setup${pluginless ? ' -- --pluginless' : ''} first`)
}

let command = './gradlew'
let commandArgs = args
if (process.platform === 'win32') {
  const studioConfig = join(worktreeDir, '.gradle/config.properties')
  const studioJavaHome = existsSync(studioConfig)
    ? readFileSync(studioConfig, 'utf8').match(/^[\t ]*java\.home[\t ]*[=:]([^\r\n]*)/m)?.[1].trim().replace(/\\([\\:= ])/g, '$1')
    : undefined
  const javaHome = process.env.JAVA_HOME || studioJavaHome
  command = javaHome ? join(javaHome, 'bin/java.exe') : 'java.exe'
  commandArgs = [
    '-Dorg.gradle.appname=gradlew',
    '-classpath',
    join(worktreeDir, 'gradle/wrapper/gradle-wrapper.jar'),
    'org.gradle.wrapper.GradleWrapperMain',
    ...args,
  ]
}

const result = spawnSync(command, commandArgs, { cwd: worktreeDir, stdio: 'inherit' })
if (result.error) {
  console.error(`Could not start Gradle: ${result.error.message}`)
  if (process.platform === 'win32') console.error('Set JAVA_HOME to your JDK, or configure the Gradle JDK in Android Studio.')
}
process.exit(result.status ?? 1)
