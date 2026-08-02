import { useRef } from 'react'

// A rectangle drawn over a document or a photo, positioned as fractions of the
// surface (0..1, top-left origin) so zoom, device pixel ratio and export
// resolution cannot shift it. Shared by both redaction editors.

export const MIN_FRACTION = 0.004 // ignore stray clicks
const HANDLES = ['nw', 'ne', 'sw', 'se']

export default function AreaBox({ area, selected, selectMode, onSelect, onChange, surfaceRef }) {
  const drag = useRef(null)

  const begin = (mode) => (e) => {
    if (!selectMode) return
    e.stopPropagation()
    e.preventDefault()
    onSelect(area.id)
    // Measure at drag start: the surface is the only source of truth for size,
    // so zoom or a responsive reflow can never desynchronise the maths.
    const r = surfaceRef.current.getBoundingClientRect()
    drag.current = { mode, sx: e.clientX, sy: e.clientY, base: { ...area }, pxW: r.width, pxH: r.height }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', end)
  }
  const move = (e) => {
    const d = drag.current
    if (!d) return
    const dx = (e.clientX - d.sx) / d.pxW
    const dy = (e.clientY - d.sy) / d.pxH
    const b = d.base
    let { x, y, w, h } = b
    if (d.mode === 'move') {
      x = b.x + dx
      y = b.y + dy
    } else {
      if (d.mode.includes('w')) { x = b.x + dx; w = b.w - dx }
      if (d.mode.includes('e')) { w = b.w + dx }
      if (d.mode.includes('n')) { y = b.y + dy; h = b.h - dy }
      if (d.mode.includes('s')) { h = b.h + dy }
      if (w < MIN_FRACTION) { w = MIN_FRACTION; if (d.mode.includes('w')) x = b.x + b.w - MIN_FRACTION }
      if (h < MIN_FRACTION) { h = MIN_FRACTION; if (d.mode.includes('n')) y = b.y + b.h - MIN_FRACTION }
    }
    // Keep areas inside the page so nothing is silently lost on export.
    x = Math.min(Math.max(0, x), 1 - w)
    y = Math.min(Math.max(0, y), 1 - h)
    onChange(area.id, { x, y, w, h })
  }
  const end = () => {
    drag.current = null
    window.removeEventListener('pointermove', move)
    window.removeEventListener('pointerup', end)
  }

  return (
    <div
      onPointerDown={begin('move')}
      style={{
        position: 'absolute',
        left: `${area.x * 100}%`,
        top: `${area.y * 100}%`,
        width: `${area.w * 100}%`,
        height: `${area.h * 100}%`,
        background: area.color === 'white' ? '#fff' : '#000',
        outline: selected ? '2px solid #B85512' : '1px solid rgba(255,255,255,.35)',
        outlineOffset: '1px',
        cursor: selectMode ? 'move' : 'crosshair',
        touchAction: 'none',
      }}
    >
      {selectMode && selected &&
        HANDLES.map((c) => (
          <span
            key={c}
            onPointerDown={begin(c)}
            style={{
              position: 'absolute',
              width: 14,
              height: 14,
              background: '#fff',
              border: '2px solid #B85512',
              borderRadius: '50%',
              top: c[0] === 'n' ? -7 : undefined,
              bottom: c[0] === 's' ? -7 : undefined,
              left: c[1] === 'w' ? -7 : undefined,
              right: c[1] === 'e' ? -7 : undefined,
              cursor: `${c}-resize`,
              touchAction: 'none',
            }}
          />
        ))}
    </div>
  )
}
