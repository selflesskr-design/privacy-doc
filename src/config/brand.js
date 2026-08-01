// Brand palette, extracted from brand/logo-source.png. Single definition point:
// the icon generator, the inline header mark, and the OG image all read these.
export const PALETTE = {
  cream: '#F7E7D3', // icon background
  paper: '#FBF3E7', // document face
  ink: '#4A342A', // document outline, redaction bar, padlock, "Privacy"
  muted: '#E4D2B8', // body lines, avatar box
  accent: '#EE8130', // shield, "Doc"
}

// Geometry of the text-free mark, in a 100x100 box. Shared by favicon.svg and
// the PNG icon generator so both stay identical.
export const MARK = {
  doc: { x: 13, y: 11, w: 46, h: 64, r: 8, fold: 12 },
  avatar: { x: 21, y: 21, w: 13, h: 13, r: 3.5 },
  line: { x: 21, y: 40, w: 28, h: 4.5, r: 2.25 },
  redaction: { x: 21, y: 49, w: 28, h: 8, r: 2.25 }, // the "가림" element
  shield: { cx: 70, y: 44, w: 34, h: 41, topR: 6 },
  lock: { w: 10, h: 9, r: 2.4, shackleR: 3 },
}

// SVG path data for the mark, derived from MARK so the inline header logo,
// favicon.svg and the PNG icons never drift apart.
export function docPath() {
  const d = MARK.doc
  return (
    `M${d.x + d.r},${d.y} H${d.x + d.w - d.fold} L${d.x + d.w},${d.y + d.fold} ` +
    `V${d.y + d.h - d.r} a${d.r},${d.r} 0 0 1 -${d.r},${d.r} H${d.x + d.r} ` +
    `a${d.r},${d.r} 0 0 1 -${d.r},-${d.r} V${d.y + d.r} a${d.r},${d.r} 0 0 1 ${d.r},-${d.r} Z`
  )
}

export function foldPath() {
  const d = MARK.doc
  return `M${d.x + d.w - d.fold},${d.y} V${d.y + d.fold} H${d.x + d.w}`
}

export function shieldPath() {
  const s = MARK.shield
  const half = s.w / 2
  return (
    `M${s.cx - half + s.topR},${s.y} H${s.cx + half - s.topR} ` +
    `a${s.topR},${s.topR} 0 0 1 ${s.topR},${s.topR} V${s.y + s.h * 0.45} ` +
    `C${s.cx + half},${s.y + s.h * 0.8} ${s.cx + s.w * 0.22},${s.y + s.h * 0.94} ${s.cx},${s.y + s.h} ` +
    `C${s.cx - s.w * 0.22},${s.y + s.h * 0.94} ${s.cx - half},${s.y + s.h * 0.8} ${s.cx - half},${s.y + s.h * 0.45} ` +
    `V${s.y + s.topR} a${s.topR},${s.topR} 0 0 1 ${s.topR},-${s.topR} Z`
  )
}

/** Padlock position on the shield, shared by every renderer. */
export function lockGeometry() {
  const s = MARK.shield
  const l = MARK.lock
  const y = s.y + s.h * 0.42
  return { ...l, cx: s.cx, y, shackleTop: y - 2.4 }
}
