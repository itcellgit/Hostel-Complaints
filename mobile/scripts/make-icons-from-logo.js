// Builds the app icon / adaptive icon / splash / favicon from assets/logo.jpg
// using Expo's own image tooling (Jimp — pure JS, no native deps).
//
//   node scripts/make-icons-from-logo.js
//
// Re-run whenever assets/logo.jpg changes, then rebuild the app.
const fs = require('fs')
const path = require('path')
const { generateImageAsync } = require('@expo/image-utils')

const ASSETS = path.join(__dirname, '..', 'assets')
const SRC = path.join(ASSETS, 'logo.jpg')
const WHITE = '#ffffff'
const NAVY = '#1e3a8a'

async function write(name, { width, height, backgroundColor }) {
  const { source } = await generateImageAsync(
    { projectRoot: path.join(__dirname, '..') },
    {
      src: SRC,
      name,
      width,
      height,
      resizeMode: 'contain',
      backgroundColor,
      removeTransparentPixels: false,
    },
  )
  fs.writeFileSync(path.join(ASSETS, name), source)
  console.log('wrote assets/' + name, `${width}x${height}`)
}

;(async () => {
  if (!fs.existsSync(SRC)) {
    console.error('assets/logo.jpg not found')
    process.exit(1)
  }
  // Launcher icon — logo on white.
  await write('icon.png', { width: 1024, height: 1024, backgroundColor: WHITE })
  // Android adaptive foreground — logo on navy (matches app.json backgroundColor).
  await write('adaptive-icon.png', { width: 1024, height: 1024, backgroundColor: NAVY })
  // Splash — logo on navy.
  await write('splash.png', { width: 1024, height: 1024, backgroundColor: NAVY })
  // Web favicon.
  await write('favicon.png', { width: 48, height: 48, backgroundColor: WHITE })
})().catch((e) => {
  console.error(e)
  process.exit(1)
})
