import { PALETTE, MARK, docPath, foldPath, shieldPath, lockGeometry } from '../config/brand.js'

// Header logo: the symbol as inline SVG plus the wordmark. Inline rather than an
// <img> so it needs no extra request, stays crisp at any zoom, and the geometry
// comes from the same source as favicon.svg and the PWA icons.
export function BrandSymbol({ className = 'h-8 w-8' }) {
  const l = lockGeometry()
  const shackle = l.shackleR - 0.75
  const rr = (o, fill) => (
    <rect x={o.x} y={o.y} width={o.w} height={o.h} rx={o.r} fill={fill} />
  )
  return (
    <svg viewBox="0 0 100 100" className={className} role="img" aria-label="Privacy">
      <rect width="100" height="100" rx="22" fill={PALETTE.cream} />
      <path d={docPath()} fill={PALETTE.paper} stroke={PALETTE.ink} strokeWidth="5" strokeLinejoin="round" />
      <path d={foldPath()} fill="none" stroke={PALETTE.ink} strokeWidth="4" strokeLinejoin="round" />
      {rr(MARK.avatar, PALETTE.muted)}
      {rr(MARK.line, PALETTE.muted)}
      {rr(MARK.redaction, PALETTE.ink)}
      <path d={shieldPath()} fill={PALETTE.accent} stroke={PALETTE.cream} strokeWidth="5" strokeLinejoin="round" />
      <path
        d={`M${l.cx - shackle},${l.y} V${l.shackleTop} a${shackle},${shackle} 0 0 1 ${shackle * 2},0 V${l.y}`}
        fill="none"
        stroke={PALETTE.ink}
        strokeWidth="2.2"
      />
      <rect x={l.cx - l.w / 2} y={l.y} width={l.w} height={l.h} rx={l.r} fill={PALETTE.ink} />
    </svg>
  )
}

export default function BrandMark() {
  return (
    <>
      <BrandSymbol />
      {/* One word, in ink. The orange lives in the shield on the symbol, which
          sits on its own cream field — on the page background that orange is
          only 2.6:1 and would fail contrast as text. */}
      <span className="text-lg font-bold tracking-tight">Privacy</span>
    </>
  )
}
