// Generates flat-colour placeholder PNGs (app icon, adaptive icon, splash)
// so the app doesn't ship with the default Expo artwork. Pure Node, no deps.
// Replace assets/*.png with real artwork when you have it, then re-run
// `npx expo prebuild --clean` (or just rebuild).
//
//   node scripts/make-placeholder-assets.js
const fs = require('fs')
const path = require('path')
const zlib = require('zlib')

const NAVY = [30, 58, 138] // #1e3a8a

function crc32(buf) {
  let c = ~0
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i]
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1))
  }
  return ~c >>> 0
}

function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const typeBuf = Buffer.from(type, 'ascii')
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])))
  return Buffer.concat([len, typeBuf, data, crc])
}

function solidPng(width, height, [r, g, b]) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])

  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 2 // colour type: truecolour
  // 10-12 = compression/filter/interlace = 0

  const row = Buffer.alloc(1 + width * 3)
  for (let x = 0; x < width; x++) {
    row[1 + x * 3] = r
    row[1 + x * 3 + 1] = g
    row[1 + x * 3 + 2] = b
  }
  const raw = Buffer.concat(Array.from({ length: height }, () => row))
  const idat = zlib.deflateSync(raw, { level: 9 })

  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

const outDir = path.join(__dirname, '..', 'assets')
fs.mkdirSync(outDir, { recursive: true })

const files = [
  ['icon.png', 1024, 1024],
  ['adaptive-icon.png', 1024, 1024],
  ['splash.png', 1284, 1284],
  ['favicon.png', 48, 48],
]

for (const [name, w, h] of files) {
  fs.writeFileSync(path.join(outDir, name), solidPng(w, h, NAVY))
  console.log('wrote assets/' + name, `${w}x${h}`)
}
