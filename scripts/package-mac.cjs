/**
 * Post-build macOS packaging. electron-builder's own zip/dmg artifacts are
 * created before the ad-hoc re-sign that makes the app launchable on modern
 * macOS, so they ship a broken bundle. This script re-signs the packed app,
 * swaps the re-signed app into electron-builder's already-styled dmg
 * (preserving the background/icon layout from electron-builder.yml), and
 * deletes electron-builder's unsafe/unsigned mac artifacts.
 *
 * Usage: node scripts/package-mac.cjs <arm64|intel|universal>
 */
const { execSync } = require('node:child_process')
const fs = require('node:fs')
const os = require('node:os')
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
// but the .app sealed inside it is signed with electron-builder's own
// ad-hoc/fallback identity, not our re-signed one, so swap it out.
const rawDmgPath = path.join(dist, `${productName}-${version}.dmg`)
const dmgPath = path.join(dist, `${productName}-${version}-${arch}.dmg`)

if (!fs.existsSync(rawDmgPath)) {
  console.error(`Expected electron-builder dmg not found at ${rawDmgPath}`)
  process.exit(1)
}

const rwDmgPath = path.join(dist, `.${productName}-${arch}-rw.dmg`)
fs.rmSync(rwDmgPath, { force: true })

// Convert the compressed dmg to a writable one so we can swap the app inside
run(`hdiutil convert "${rawDmgPath}" -format UDRW -o "${rwDmgPath}"`)
// The converted dmg keeps the original's tight size, leaving no room to
// swap in the app. Size it well above the app's actual size — a fixed
// guess isn't enough headroom for an Electron app this size.
const appSizeMb = parseInt(execSync(`du -sm "${appPath}"`).toString().split(/\s+/)[0], 10)
const rwSizeMb = appSizeMb * 2 + 300
run(`hdiutil resize -size ${rwSizeMb}m "${rwDmgPath}"`)

const mountPoint = fs.mkdtempSync(path.join(os.tmpdir(), 'overtone-dmg-mount-'))
run(`hdiutil attach "${rwDmgPath}" -mountpoint "${mountPoint}" -nobrowse -quiet`)

try {
  const mountedAppPath = path.join(mountPoint, `${productName}.app`)
  fs.rmSync(mountedAppPath, { recursive: true, force: true })
  run(`cp -R "${appPath}" "${mountedAppPath}"`)
  run(`codesign --force --deep --sign - "${mountedAppPath}"`)
} finally {
  run(`hdiutil detach "${mountPoint}" -quiet`)
}

fs.rmSync(dmgPath, { force: true })
run(`hdiutil convert "${rwDmgPath}" -format UDZO -o "${dmgPath}"`)
fs.rmSync(rwDmgPath, { force: true })
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
