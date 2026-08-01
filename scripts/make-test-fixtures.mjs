#!/usr/bin/env node

// Builds the Korean PDF fixtures used to check rendering. All content is made
// up — no real personal data. Output goes to docs/fixtures/ (gitignored).
//
//   node scripts/make-test-fixtures.mjs

import { writeFileSync, mkdirSync } from 'node:fs'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const require = createRequire(path.join(root, 'package.json'))
const { PDFDocument, rgb, degrees } = require('pdf-lib')
const fontkit = require('@pdf-lib/fontkit')

const out = path.join(root, 'docs', 'fixtures')
mkdirSync(out, { recursive: true })

const ttf = readFileSync(path.join(root, 'public', 'fonts', 'Pretendard-Regular.ttf'))
const LINES = [
  '주민등록등본 (예시 — 실제 정보 아님)',
  '성명: 홍길동    생년월일: 1990년 1월 1일',
  '주민등록번호: 900101-1234567',
  '주소: 서울특별시 강남구 테헤란로 123',
  '세대주와의 관계: 본인',
  'English mixed 123 / 漢字 혼용 테스트',
]

async function embedded({ pages = 1, rotate = 0 } = {}) {
  const doc = await PDFDocument.create()
  doc.registerFontkit(fontkit)
  const font = await doc.embedFont(ttf, { subset: true })
  for (let p = 0; p < pages; p++) {
    const page = doc.addPage([595.28, 841.89])
    if (rotate) page.setRotation(degrees(rotate))
    page.drawText(`${p + 1} 페이지`, { x: 50, y: 780, size: 12, font, color: rgb(0.4, 0.4, 0.4) })
    LINES.forEach((line, i) => {
      page.drawText(line, { x: 50, y: 730 - i * 28, size: 14, font, color: rgb(0.1, 0.1, 0.1) })
    })
  }
  return doc.save()
}

/**
 * A Korean PDF with NO embedded font: a Type0 font using the KSCms-UHC-H CMap
 * with a non-embedded KSCms-UHC descendant. This is the case that fails when
 * pdf.js has no local cmaps — exactly what we are testing.
 */
function noEmbeddedFont() {
  // "안녕하세요 한글" in UHC (CP949) bytes, as a hex string for the Tj operator.
  const uhc = Buffer.from('안녕하세요 한글 테스트', 'latin1')
  void uhc
  const hex = Buffer.from(
    // CP949 bytes for 안녕하세요 한글
    [0xbe, 0xc8, 0xb3, 0xe7, 0xc7, 0xcf, 0xbc, 0xbc, 0xbf, 0xe4, 0x20, 0xc7, 0xd1, 0xb1, 0xdb],
  ).toString('hex')

  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 6 0 R >>',
    '<< /Type /Font /Subtype /Type0 /BaseFont /HYSMyeongJo-Medium /Encoding /KSCms-UHC-H /DescendantFonts [5 0 R] >>',
    '<< /Type /Font /Subtype /CIDFontType0 /BaseFont /HYSMyeongJo-Medium ' +
      '/CIDSystemInfo << /Registry (Adobe) /Ordering (Korea1) /Supplement 2 >> ' +
      '/FontDescriptor << /Type /FontDescriptor /FontName /HYSMyeongJo-Medium /Flags 6 ' +
      '/FontBBox [0 -148 1001 880] /ItalicAngle 0 /Ascent 880 /Descent -148 /CapHeight 720 /StemV 60 >> /DW 1000 >>',
  ]
  const stream = `BT /F1 20 Tf 50 700 Td <${hex}> Tj ET`
  objects.push(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`)

  let pdf = '%PDF-1.4\n'
  const offsets = []
  objects.forEach((body, i) => {
    offsets.push(pdf.length)
    pdf += `${i + 1} 0 obj\n${body}\nendobj\n`
  })
  const xref = pdf.length
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`
  for (const off of offsets) pdf += `${String(off).padStart(10, '0')} 00000 n \n`
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`
  return Buffer.from(pdf, 'latin1')
}

/** A "scanned" PDF: one page that is nothing but an image, no text layer. */
async function scanned() {
  const src = await PDFDocument.load(await embedded({ pages: 1 }))
  void src
  const doc = await PDFDocument.create()
  // A tiny grey PNG stretched over the page stands in for a scan.
  const png = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    'base64',
  )
  const img = await doc.embedPng(png)
  const page = doc.addPage([595.28, 841.89])
  page.drawImage(img, { x: 0, y: 0, width: 595.28, height: 841.89 })
  return doc.save()
}

const write = (name, bytes) => {
  writeFileSync(path.join(out, name), bytes)
  console.log(`  ${name}  ${(bytes.length / 1024).toFixed(1)} KB`)
}

console.log('docs/fixtures/:')
write('ko-embedded.pdf', await embedded())
write('ko-no-embedded-font.pdf', noEmbeddedFont())
write('ko-scanned.pdf', await scanned())
write('ko-rotated.pdf', await embedded({ rotate: 90 }))
write('ko-multipage.pdf', await embedded({ pages: 3 }))
