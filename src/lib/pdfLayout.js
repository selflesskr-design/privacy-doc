import { PAGE_SIZES } from './pageSizes.js'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'

// Flowed-text PDF renderer built on pdf-lib's standard fonts. Turns a simple
// block model into a paginated PDF. This is intentionally an APPROXIMATE layout
// engine — it handles headings, paragraphs, bold/italic/inline-code runs, lists,
// blockquotes, code blocks, and horizontal rules. It does NOT do tables, floats,
// images, or complex CSS. Operations that use it label their output accordingly.
//
// Block model:
//   { type: 'heading', level: 1..6, runs }
//   { type: 'paragraph', runs }
//   { type: 'listitem', ordered: bool, index: n, depth: 0.., runs }
//   { type: 'blockquote', runs }
//   { type: 'code', text }        // preformatted block
//   { type: 'hr' }
// run = { text, bold?, italic?, code? }

const HEADING_SCALE = { 1: 1.9, 2: 1.55, 3: 1.3, 4: 1.15, 5: 1.05, 6: 1 }

export async function renderBlocksToPdf(blocks, opts = {}) {
  const {
    pageSize = 'A4',
    margin = 56,
    fontSize = 11,
    lineHeight = 1.45,
  } = opts

  const [pw, ph] = PAGE_SIZES[pageSize] || PAGE_SIZES.A4
  const doc = await PDFDocument.create()

  const fonts = {
    regular: await doc.embedFont(StandardFonts.Helvetica),
    bold: await doc.embedFont(StandardFonts.HelveticaBold),
    italic: await doc.embedFont(StandardFonts.HelveticaOblique),
    boldItalic: await doc.embedFont(StandardFonts.HelveticaBoldOblique),
    mono: await doc.embedFont(StandardFonts.Courier),
  }
  const fontFor = (run, heading) => {
    if (run.code) return fonts.mono
    const bold = run.bold || heading
    if (bold && run.italic) return fonts.boldItalic
    if (bold) return fonts.bold
    if (run.italic) return fonts.italic
    return fonts.regular
  }

  let page = doc.addPage([pw, ph])
  let y = ph - margin
  const contentW = pw - margin * 2

  const ensureSpace = (needed) => {
    if (y - needed < margin) {
      page = doc.addPage([pw, ph])
      y = ph - margin
    }
  }

  // Tokenize runs into words (keeping spaces) and lay them out into lines that
  // fit maxWidth. Returns array of lines; each line is array of {text,font,size,color}.
  const layout = (runs, size, maxWidth, heading, color) => {
    const tokens = []
    for (const run of runs || []) {
      const font = fontFor(run, heading)
      const parts = String(run.text ?? '').split(/(\s+)/)
      for (const part of parts) {
        if (part === '') continue
        tokens.push({ text: part, font, size, isSpace: /^\s+$/.test(part), color })
      }
    }
    const lines = [[]]
    let w = 0
    const push = (t) => {
      lines[lines.length - 1].push(t)
      w += t.font.widthOfTextAtSize(t.text, t.size)
    }
    for (const t of tokens) {
      const tw = t.font.widthOfTextAtSize(t.text, t.size)
      if (t.isSpace) {
        if (lines[lines.length - 1].length === 0) continue // no leading space
        push(t)
        continue
      }
      if (tw > maxWidth) {
        // Break a very long word by characters.
        for (const ch of t.text) {
          const cw = t.font.widthOfTextAtSize(ch, t.size)
          if (w + cw > maxWidth && lines[lines.length - 1].length) {
            lines.push([])
            w = 0
          }
          push({ ...t, text: ch })
        }
        continue
      }
      if (w + tw > maxWidth && lines[lines.length - 1].length) {
        // trim trailing space
        const line = lines[lines.length - 1]
        if (line.length && line[line.length - 1].isSpace) line.pop()
        lines.push([])
        w = 0
      }
      push(t)
    }
    return lines
  }

  const drawLines = (lines, size, x0, color = rgb(0.1, 0.12, 0.16)) => {
    const lh = size * lineHeight
    for (const line of lines) {
      ensureSpace(lh)
      y -= lh
      let x = x0
      for (const t of line) {
        page.drawText(t.text, { x, y, size: t.size, font: t.font, color: t.color || color })
        x += t.font.widthOfTextAtSize(t.text, t.size)
      }
    }
  }

  // These converters intentionally stay on the standard PDF fonts, which cannot
  // encode Hangul. Rather than embed a Korean face here, surface the limit
  // clearly — see docs/smoke-test-plan.md.
  try {
  for (const block of blocks) {
    if (block.type === 'hr') {
      ensureSpace(16)
      y -= 8
      page.drawLine({
        start: { x: margin, y },
        end: { x: pw - margin, y },
        thickness: 0.75,
        color: rgb(0.8, 0.82, 0.85),
      })
      y -= 8
      continue
    }

    if (block.type === 'code') {
      const size = fontSize - 1
      const lh = size * 1.35
      const raw = String(block.text || '').replace(/\t/g, '    ')
      const rawLines = raw.split('\n')
      // char-wrap each line to content width
      const maxChars = Math.max(8, Math.floor((contentW - 16) / fonts.mono.widthOfTextAtSize('m', size)))
      const wrapped = []
      for (const l of rawLines) {
        if (l.length <= maxChars) wrapped.push(l)
        else for (let i = 0; i < l.length; i += maxChars) wrapped.push(l.slice(i, i + maxChars))
      }
      y -= 6
      const blockH = wrapped.length * lh + 12
      ensureSpace(blockH)
      const top = y
      page.drawRectangle({
        x: margin,
        y: top - blockH + 6,
        width: contentW,
        height: blockH,
        color: rgb(0.96, 0.97, 0.98),
        borderColor: rgb(0.88, 0.9, 0.92),
        borderWidth: 0.5,
      })
      y -= 6
      for (const l of wrapped) {
        y -= lh
        page.drawText(l, { x: margin + 8, y, size, font: fonts.mono, color: rgb(0.2, 0.22, 0.28) })
      }
      y -= 12
      continue
    }

    if (block.type === 'heading') {
      const size = Math.round(fontSize * (HEADING_SCALE[block.level] || 1))
      y -= size * 0.7
      const lines = layout(block.runs, size, contentW, true)
      drawLines(lines, size, margin, rgb(0.06, 0.08, 0.12))
      y -= size * 0.35
      continue
    }

    if (block.type === 'listitem') {
      const size = fontSize
      const indent = 18 + (block.depth || 0) * 18
      const marker = block.ordered ? `${block.index}.` : '•'
      const markerW = fonts.regular.widthOfTextAtSize(marker + ' ', size)
      const lines = layout(block.runs, size, contentW - indent - markerW, false)
      // draw marker on first line
      const lh = size * lineHeight
      ensureSpace(lh)
      y -= lh
      page.drawText(marker, { x: margin + indent, y, size, font: fonts.regular, color: rgb(0.2, 0.22, 0.28) })
      let first = true
      const x0 = margin + indent + markerW
      for (const line of lines) {
        if (!first) {
          ensureSpace(lh)
          y -= lh
        }
        first = false
        let x = x0
        for (const t of line) {
          page.drawText(t.text, { x, y, size: t.size, font: t.font, color: t.color || rgb(0.1, 0.12, 0.16) })
          x += t.font.widthOfTextAtSize(t.text, t.size)
        }
      }
      y -= size * 0.25
      continue
    }

    if (block.type === 'blockquote') {
      const size = fontSize
      const indent = 16
      const lines = layout(block.runs, size, contentW - indent, false, rgb(0.35, 0.38, 0.45))
      const lh = size * lineHeight
      const startY = y
      drawLines(lines, size, margin + indent, rgb(0.35, 0.38, 0.45))
      page.drawRectangle({
        x: margin,
        y: y,
        width: 3,
        height: startY - y,
        color: rgb(0.6, 0.63, 0.7),
      })
      y -= size * 0.4
      continue
    }

    // paragraph (default)
    const size = fontSize
    const lines = layout(block.runs, size, contentW, false)
    if (lines.length === 1 && lines[0].length === 0) {
      y -= size * lineHeight * 0.6
    } else {
      drawLines(lines, size, margin)
      y -= size * 0.5
    }
  }
  } catch (err) {
    if (/WinAnsi cannot encode/.test(err?.message || '')) {
      throw new Error(
        '이 변환 도구는 아직 한글을 지원하지 않습니다. 한글이 포함되지 않은 문서만 변환할 수 있습니다. ' +
          '한글 문서에 텍스트를 넣어야 한다면 "Edit PDF"를 이용해 주세요.',
      )
    }
    throw err
  }

  const bytes = await doc.save()
  return new Blob([bytes], { type: 'application/pdf' })
}
