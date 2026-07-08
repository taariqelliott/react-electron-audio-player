/**
 * afterPack hook: when cross-building for another platform/arch, the packed
 * better-sqlite3 binary is the host's. This swaps in the official prebuilt
 * binary matching the target platform, arch, and Electron ABI.
 */
const { execSync } = require('node:child_process')
const fs = require('node:fs')
const path = require('node:path')

const ARCH_NAMES = { 0: 'ia32', 1: 'x64', 2: 'armv7l', 3: 'arm64', 4: 'universal' }

module.exports = async function afterPack(context) {
  const platform = context.electronPlatformName
  const arch = ARCH_NAMES[context.arch] ?? 'x64'

  // Universal merge pass: the per-arch packs were already fixed and lipo-fused
  if (arch === 'universal') return
  // Host-native builds already contain the right binary
  if (platform === process.platform && arch === process.arch) return

  const sqliteVersion = require('better-sqlite3/package.json').version
  const electronVersion = require('electron/package.json').version
  const abi = require('node-abi').getAbi(electronVersion, 'electron')

  const tarName = `better-sqlite3-v${sqliteVersion}-electron-v${abi}-${platform}-${arch}.tar.gz`
  const url = `https://github.com/WiseLibs/better-sqlite3/releases/download/v${sqliteVersion}/${tarName}`

  const cacheDir = path.join(__dirname, '..', 'build', 'prebuilds', `electron-v${abi}-${platform}-${arch}`)
  const cachedBinary = path.join(cacheDir, 'build', 'Release', 'better_sqlite3.node')

  if (!fs.existsSync(cachedBinary)) {
    fs.mkdirSync(cacheDir, { recursive: true })
    console.log(`  • downloading ${tarName}`)
    execSync(`curl -fsSL "${url}" | tar -xz -C "${cacheDir}"`, { stdio: 'inherit' })
  }
  if (!fs.existsSync(cachedBinary)) {
    throw new Error(`No prebuild for better-sqlite3 ${sqliteVersion} / Electron ABI ${abi} / ${platform}-${arch}`)
  }

  const resourcesDir =
    platform === 'darwin'
      ? path.join(context.appOutDir, `${context.packager.appInfo.productFilename}.app`, 'Contents', 'Resources')
      : path.join(context.appOutDir, 'resources')

  const target = path.join(
    resourcesDir,
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
  console.log(`  • swapped better_sqlite3.node with ${platform}-${arch} prebuild (ABI ${abi})`)
}
