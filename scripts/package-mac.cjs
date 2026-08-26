/**
 * Post-build macOS packaging. electron-builder's own zip/dmg artifacts are
 * created before the ad-hoc re-sign that makes the app launchable on modern
 * macOS, so they ship a broken bundle. This script re-signs the packed app
 * and the dmg electron-builder already built (background/icon layout comes
 * from electron-builder.yml), renames artifacts with an arch suffix, and
 * deletes electron-builder's unsafe/unsigned mac artifacts.
 *
 * Usage: node scripts/package-mac.cjs <arm64|intel|universal>
 */
const { execSync } = require('node:child_process')
const fs = require('node:fs')
const path = require('node:path')

const arch = process.argv[2]
const dirByArch = { arm64: 'mac-arm64', intel: 'mac', universal: 'mac-universal' }
if (!dirByArch[arch]) {
  console.error(`Usage: node scripts/package-mac.cjs <${Object.keys(dirByArch).join('|')}>`)
  process.exit(1)
}

const run = (cmd) => execSync(cmd, { stdio: 'inherit' })
const version = require('../package.json').version
const productName = 'Overtone'
const dist = path.join(__dirname, '..', 'dist')
const appPath = path.join(dist, dirByArch[arch], `${productName}.app`)

// Re-sign the packed app so it launches on modern macOS
run(`codesign --force --deep --sign - "${appPath}"`)

// Re-build the zip from the re-signed app
const zipPath = path.join(dist, `${productName}-${version}-${arch}.zip`)
fs.rmSync(zipPath, { force: true })
run(`ditto -c -k --keepParent "${appPath}" "${zipPath}"`)

// electron-builder already built a styled dmg (background/icon layout from
// electron-builder.yml) using its artifactName pattern: ${productName}-${version}.${ext}
const rawDmgPath = path.join(dist, `${productName}-${version}.dmg`)
const dmgPath = path.join(dist, `${productName}-${version}-${arch}.dmg`)

if (!fs.existsSync(rawDmgPath)) {
  console.error(`Expected electron-builder dmg not found at ${rawDmgPath}`)
  process.exit(1)
}

fs.rmSync(dmgPath, { force: true })
fs.renameSync(rawDmgPath, dmgPath)
run(`codesign --force --sign - "${dmgPath}"`)

for (const file of fs.readdirSync(dist)) {
  const isFinalArtifact = new RegExp(
    `^${productName}-${version}-${arch}\\.(zip|dmg)(\\.blockmap)?$`
  ).test(file)
  const isRawArtifact =
    /^(react-electron-audio-player|Overtone)-.*(mac\.zip|\.dmg)(\.blockmap)?$/.test(file)
  if (isRawArtifact && !isFinalArtifact) {
    fs.rmSync(path.join(dist, file), { force: true })
    console.log(`  • removed unsafe artifact ${file}`)
  }
}

console.log(`  • packaged ${path.basename(zipPath)} and ${path.basename(dmgPath)}`)
