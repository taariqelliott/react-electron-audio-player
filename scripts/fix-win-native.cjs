/**
 * afterPack hook: when cross-building for Windows from macOS/Linux, the packed
 * better-sqlite3 binary is the host platform's. This swaps in the official
 * prebuilt Windows binary matching the target Electron ABI.
 */
const { execSync } = require('node:child_process')
const fs = require('node:fs')
const path = require('node:path')

const ARCH_NAMES = { 0: 'ia32', 1: 'x64', 2: 'armv7l', 3: 'arm64' }

module.exports = async function afterPack(context) {
  if (context.electronPlatformName !== 'win32') return

  const arch = ARCH_NAMES[context.arch] ?? 'x64'
  const sqliteVersion = require('better-sqlite3/package.json').version
  const electronVersion = require('electron/package.json').version
  const abi = require('node-abi').getAbi(electronVersion, 'electron')

  const tarName = `better-sqlite3-v${sqliteVersion}-electron-v${abi}-win32-${arch}.tar.gz`
  const url = `https://github.com/WiseLibs/better-sqlite3/releases/download/v${sqliteVersion}/${tarName}`

  const cacheDir = path.join(__dirname, '..', 'build', 'prebuilds', `electron-v${abi}-win32-${arch}`)
  const cachedBinary = path.join(cacheDir, 'build', 'Release', 'better_sqlite3.node')

  if (!fs.existsSync(cachedBinary)) {
    fs.mkdirSync(cacheDir, { recursive: true })
    console.log(`  • downloading ${tarName}`)
    execSync(`curl -fsSL "${url}" | tar -xz -C "${cacheDir}"`, { stdio: 'inherit' })
  }
  if (!fs.existsSync(cachedBinary)) {
    throw new Error(`No Windows prebuild for better-sqlite3 ${sqliteVersion} / Electron ABI ${abi}`)
  }

  const target = path.join(
    context.appOutDir,
    'resources',
    'app.asar.unpacked',
    'node_modules',
    'better-sqlite3',
    'build',
    'Release',
    'better_sqlite3.node'
  )
  if (!fs.existsSync(path.dirname(target))) {
    throw new Error(`Expected unpacked better-sqlite3 at ${target}`)
  }
  fs.copyFileSync(cachedBinary, target)
  console.log(`  • swapped better_sqlite3.node with win32-${arch} prebuild (ABI ${abi})`)
}
