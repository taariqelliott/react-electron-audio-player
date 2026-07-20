/**
 * Post-build macOS packaging. electron-builder's own zip/dmg artifacts are
 * created before the ad-hoc re-sign that makes the app launchable on modern
 * macOS, so they ship a broken bundle. This script re-signs the packed app,
 * produces the real distributables (zip + dmg with an Applications shortcut),
 * and deletes electron-builder's unsafe mac artifacts.
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
const dist = path.join(__dirname, '..', 'dist')
const appPath = path.join(dist, dirByArch[arch], 'react-electron-audio-player.app')

run(`codesign --force --deep --sign - "${appPath}"`)

const zipPath = path.join(dist, `AudioPlayer-${version}-${arch}.zip`)
fs.rmSync(zipPath, { force: true })
run(`ditto -c -k --keepParent "${appPath}" "${zipPath}"`)

const staging = fs.mkdtempSync(path.join(os.tmpdir(), 'audio-player-dmg-'))
run(`cp -R "${appPath}" "${staging}/"`)
fs.symlinkSync('/Applications', path.join(staging, 'Applications'))
const dmgPath = path.join(dist, `AudioPlayer-${version}-${arch}.dmg`)
fs.rmSync(dmgPath, { force: true })
run(
  `hdiutil create -volname "Audio Player" -srcfolder "${staging}" -ov -quiet -format UDZO "${dmgPath}"`
)
fs.rmSync(staging, { recursive: true, force: true })

for (const file of fs.readdirSync(dist)) {
  if (/^react-electron-audio-player-.*(mac\.zip|\.dmg)(\.blockmap)?$/.test(file)) {
    fs.rmSync(path.join(dist, file), { force: true })
    console.log(`  • removed unsafe artifact ${file}`)
  }
}

console.log(`  • packaged ${path.basename(zipPath)} and ${path.basename(dmgPath)}`)
