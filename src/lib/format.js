// Small formatting/util helpers shared across operations.

/** Join class names, dropping falsy values. */
export function cx(...parts) {
  return parts.filter(Boolean).join(' ')
}

/** Human-readable byte size, e.g. 1536 -> "1.5 KB". */
export function formatBytes(bytes, decimals = 1) {
  if (bytes === 0 || bytes == null) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), sizes.length - 1)
  const value = bytes / Math.pow(k, i)
  return `${value.toFixed(i === 0 ? 0 : decimals)} ${sizes[i]}`
}

/** Percentage reduction from `before` to `after` size (positive = smaller). */
export function percentChange(before, after) {
  if (!before) return 0
  return Math.round(((before - after) / before) * 100)
}

/** Strip the extension from a filename: "a.b.pdf" -> "a.b". */
export function baseName(name = '') {
  const dot = name.lastIndexOf('.')
  return dot > 0 ? name.slice(0, dot) : name
}

/** Parse "1-3,5,8-10" into a sorted, de-duplicated list of 1-based page numbers. */
export function parsePageRanges(input, maxPage) {
  const pages = new Set()
  const cleaned = String(input || '').trim()
  if (!cleaned) return []
  for (const part of cleaned.split(',')) {
    const seg = part.trim()
    if (!seg) continue
    const m = seg.match(/^(\d+)\s*-\s*(\d+)$/)
    if (m) {
      let a = parseInt(m[1], 10)
      let b = parseInt(m[2], 10)
      if (a > b) [a, b] = [b, a]
      for (let p = a; p <= b; p++) if (p >= 1 && p <= maxPage) pages.add(p)
    } else if (/^\d+$/.test(seg)) {
      const p = parseInt(seg, 10)
      if (p >= 1 && p <= maxPage) pages.add(p)
    } else {
      throw new Error(`페이지 범위를 알아볼 수 없습니다: "${seg}"`)
    }
  }
  return [...pages].sort((a, b) => a - b)
}
