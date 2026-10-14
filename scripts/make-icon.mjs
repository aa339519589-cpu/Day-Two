import { deflateSync } from 'node:zlib'
import { writeFileSync } from 'node:fs'

function crc32(buf) {
  let c = ~0
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i]
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1))
  }
  return ~c >>> 0
}

function chunk(type, data) {
  const t = Buffer.from(type)
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const body = Buffer.concat([t, data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(body))
  return Buffer.concat([len, body, crc])
}

function png(size, paint) {
  const raw = Buffer.alloc((size * 4 + 1) * size)
  for (let y = 0; y < size; y++) {
    const row = y * (size * 4 + 1)
    raw[row] = 0
    for (let x = 0; x < size; x++) {
      const [r, g, b, a] = paint(x, y, size)
      const i = row + 1 + x * 4
      raw[i] = r
      raw[i + 1] = g
      raw[i + 2] = b
      raw[i + 3] = a
    }
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8
  ihdr[9] = 6
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

function rounded(x, y, size) {
  const r = size * 0.22
  const dx = x < r ? r - x : x > size - r ? x - (size - r) : 0
  const dy = y < r ? r - y : y > size - r ? y - (size - r) : 0
  return dx * dx + dy * dy <= r * r
}

function bar(x, y, size, cx) {
  const w = size * 0.085
  const h = size * 0.46
  const top = (size - h) / 2
  const left = cx - w / 2
  if (x < left || x > left + w || y < top || y > top + h) return false
  const rx = w / 2
  const ly = y - top
  if (ly < rx) {
    const dx = x - (left + rx)
    const dy = ly - rx
    return dx * dx + dy * dy <= rx * rx
  }
  if (ly > h - rx) {
    const dx = x - (left + rx)
    const dy = ly - (h - rx)
    return dx * dx + dy * dy <= rx * rx
  }
  return true
}

function paint(x, y, size) {
  if (!rounded(x, y, size)) return [0, 0, 0, 0]
  if (bar(x, y, size, size * 0.39)) return [168, 199, 232, 255]
  if (bar(x, y, size, size * 0.61)) return [243, 225, 160, 255]
  return [248, 247, 241, 255]
}

for (const size of [180, 192, 512]) {
  const name = size === 180 ? 'public/apple-touch-icon.png' : `public/icon-${size}.png`
  writeFileSync(name, png(size, paint))
}
