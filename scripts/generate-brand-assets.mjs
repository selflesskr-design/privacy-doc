#!/usr/bin/env node

// Generates the text-free Privacy mark: favicon.svg + the PWA/Apple PNG icons.
// The mark is drawn from the shared geometry in src/config/brand.js, so the SVG
// and the rasters are the same shape. Zero image dependencies — a small PNG
// encoder (RGBA -> zlib deflate) plus 4x supersampling for smooth edges.
//
// Run: npm run gen:brand

import { deflateSync } from 'node:zlib'
import { writeFileSync, mkdirSync } from 'node:fs'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { dirname, join, resolve } from 'node:path'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const OUT = join(root, 'public')
mkdirSync(OUT, { recursive: true })

const { PALETTE, MARK, docPath, foldPath, shieldPath, lockGeometry } = await import(
  pathToFileURL(join(root, 'src', 'config', 'brand.js')).href
)

// ── PNG encoding ────────────────────────────────────────────────────────────
const CRC_TABLE = (() => {
  const t = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[n] = c >>> 0
  }
  return t
})()
const crc32 = (buf) => {
  let c = 0xffffffff
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}
function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length, 0)
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(body), 0)
  return Buffer.concat([len, body, crc])
}
export function encodePNG(width, height, rgba) {
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // RGBA
  const stride = width * 4
  const raw = Buffer.alloc((stride + 1) * height)
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride)
  }
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

const hex = (h) => [
  parseInt(h.slice(1, 3), 16),
  parseInt(h.slice(3, 5), 16),
  parseInt(h.slice(5, 7), 16),
]

// ── A tiny canvas: coverage-based fills in mark space (0..100) ───────────────
// Every shape is expressed as an inside(x, y) predicate evaluated per sample,
// which keeps rounded rects, the shield and the padlock in the same pipeline.
function createCanvas(size, scale) {
  const S = size * scale
  const buf = Buffer.alloc(S * S * 4)
  const toMark = (p) => ((p + 0.5) / S) * 100

  const fill = (inside, color) => {
    const [r, g, b] = hex(color)
    for (let py = 0; py < S; py++) {
      const my = toMark(py)
      for (let px = 0; px < S; px++) {
        if (!inside(toMark(px), my)) continue
        const i = (py * S + px) * 4
        buf[i] = r
        buf[i + 1] = g
        buf[i + 2] = b
        buf[i + 3] = 255
      }
    }
  }

  // Box-downsample the supersampled buffer to the final size.
  const resolve_ = () => {
    const out = Buffer.alloc(size * size * 4)
    const n = scale * scale
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        let r = 0, g = 0, b = 0, a = 0
        for (let sy = 0; sy < scale; sy++) {
          for (let sx = 0; sx < scale; sx++) {
            const i = ((y * scale + sy) * S + (x * scale + sx)) * 4
            r += buf[i]; g += buf[i + 1]; b += buf[i + 2]; a += buf[i + 3]
          }
        }
        const o = (y * size + x) * 4
        out[o] = Math.round(r / n)
        out[o + 1] = Math.round(g / n)
        out[o + 2] = Math.round(b / n)
        out[o + 3] = Math.round(a / n)
      }
    }
    return out
  }

  return { fill, resolve: resolve_ }
}

// ── Shape predicates, all in the 0..100 mark space ──────────────────────────
const roundRect = ({ x, y, w, h, r }) => (px, py) => {
  if (px < x || py < y || px > x + w || py > y + h) return false
  const dx = Math.max(x + r - px, 0, px - (x + w - r))
  const dy = Math.max(y + r - py, 0, py - (y + h - r))
  return dx * dx + dy * dy <= r * r
}

/** Document body: rounded rect with the top-right corner cut off diagonally. */
const docBody = (d) => {
  const base = roundRect(d)
  return (px, py) => {
    if (!base(px, py)) return false
    const rx = d.x + d.w - px
    const ry = py - d.y
    return !(ry < d.fold && rx < d.fold && ry + rx < d.fold) // the folded corner
  }
}

/** Shield: rounded shoulders, then curved flanks easing into a bottom tip. */
const shieldShape = ({ cx, y, w, h, topR = 6 }) => (px, py) => {
  if (py < y || py > y + h) return false
  const t = (py - y) / h
  // Full width down to the shoulder, then ease in to the tip.
  const halfW = t < 0.45 ? w / 2 : (w / 2) * Math.sqrt(Math.max(0, 1 - ((t - 0.45) / 0.55) ** 2))
  const dx = Math.abs(px - cx)
  if (dx > halfW) return false
  // Round the two top corners.
  const dy = py - y
  if (dy < topR && dx > halfW - topR) {
    return Math.hypot(dx - (halfW - topR), dy - topR) <= topR
  }
  return true
}

/** Grow a shape outward by `d` — used to knock a cream gap around the shield. */
const outset = (inside, d) => (px, py) => {
  const steps = 12
  for (let i = 0; i < steps; i++) {
    const a = (i / steps) * Math.PI * 2
    if (inside(px + Math.cos(a) * d, py + Math.sin(a) * d)) return true
  }
  return inside(px, py)
}

const ring = (cx, cy, rOuter, rInner, yMax) => (px, py) => {
  if (py > yMax) return false
  const d = Math.hypot(px - cx, py - cy)
  return d <= rOuter && d >= rInner
}

/**
 * Draw the mark. `inset` shrinks the symbol toward the centre, leaving padding
 * for Android's maskable safe area.
 */
function drawMark(size, { inset = 1 } = {}) {
  const scale = 4
  const c = createCanvas(size, scale)
  const at = (v) => 50 + (v - 50) * inset

  const T = (shape) => (px, py) => shape(50 + (px - 50) / inset, 50 + (py - 50) / inset)

  c.fill(roundRect({ x: 0, y: 0, w: 100, h: 100, r: 22 }), PALETTE.cream)

  const d = MARK.doc
  c.fill(T(outset(docBody(d), 2.6)), PALETTE.ink) // outline
  c.fill(T(docBody({ ...d, x: d.x + 2.6, y: d.y + 2.6, w: d.w - 5.2, h: d.h - 5.2, r: d.r - 1, fold: d.fold - 2.6 })), PALETTE.paper)
  c.fill(T(roundRect(MARK.avatar)), PALETTE.muted)
  c.fill(T(roundRect(MARK.line)), PALETTE.muted)
  c.fill(T(roundRect(MARK.redaction)), PALETTE.ink) // the masking bar

  const s = MARK.shield
  c.fill(T(outset(shieldShape(s), 2.2)), PALETTE.cream) // gap so the shield reads
  c.fill(T(shieldShape(s)), PALETTE.accent)

  // Padlock, centred on the shield's upper body.
  const lockY = s.y + s.h * 0.42
  const l = MARK.lock
  c.fill(T(ring(s.cx, lockY, l.shackleR, l.shackleR - 1.5, lockY)), PALETTE.ink)
  c.fill(T(roundRect({ x: s.cx - l.w / 2, y: lockY, w: l.w, h: l.h, r: l.r })), PALETTE.ink)

  void at
  return encodePNG(size, size, c.resolve())
}

// ── favicon.svg — same geometry, as vectors ─────────────────────────────────
function faviconSvg() {
  const l = lockGeometry()
  const shackle = l.shackleR - 0.75
  const rr = (o, fill) =>
    `<rect x="${o.x}" y="${o.y}" width="${o.w}" height="${o.h}" rx="${o.r}" fill="${fill}"/>`

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" role="img" aria-label="Privacy">
  <rect width="100" height="100" rx="22" fill="${PALETTE.cream}"/>
  <path d="${docPath()}" fill="${PALETTE.paper}" stroke="${PALETTE.ink}" stroke-width="5" stroke-linejoin="round"/>
  <path d="${foldPath()}" fill="none" stroke="${PALETTE.ink}" stroke-width="4" stroke-linejoin="round"/>
  ${rr(MARK.avatar, PALETTE.muted)}
  ${rr(MARK.line, PALETTE.muted)}
  ${rr(MARK.redaction, PALETTE.ink)}
  <path d="${shieldPath()}" fill="${PALETTE.accent}" stroke="${PALETTE.cream}" stroke-width="5" stroke-linejoin="round"/>
  <path d="M${l.cx - shackle},${l.y} V${l.shackleTop} a${shackle},${shackle} 0 0 1 ${shackle * 2},0 V${l.y}" fill="none" stroke="${PALETTE.ink}" stroke-width="2.2"/>
  <rect x="${l.cx - l.w / 2}" y="${l.y}" width="${l.w}" height="${l.h}" rx="${l.r}" fill="${PALETTE.ink}"/>
</svg>
`
}

writeFileSync(join(OUT, 'favicon.svg'), faviconSvg())
writeFileSync(join(OUT, 'pwa-192.png'), drawMark(192))
writeFileSync(join(OUT, 'pwa-512.png'), drawMark(512))
writeFileSync(join(OUT, 'apple-touch-icon-180.png'), drawMark(180))
// Android crops maskable icons: keep the symbol inside the safe area.
writeFileSync(join(OUT, 'pwa-512-maskable.png'), drawMark(512, { inset: 0.78 }))

console.log(
  'public/: favicon.svg, pwa-192.png, pwa-512.png, pwa-512-maskable.png, apple-touch-icon-180.png',
)
