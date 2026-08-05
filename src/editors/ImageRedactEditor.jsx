import { useState, useRef, useEffect, useCallback } from 'react'
import Dropzone from '../components/Dropzone.jsx'
import Progress from '../components/Progress.jsx'
import Note from '../components/Note.jsx'
import Icon from '../components/Icon.jsx'
import AreaBox, { MIN_FRACTION } from '../components/AreaBox.jsx'
import { useJob } from '../hooks/useJob.js'
import { baseName } from '../lib/format.js'
import { COMMON, IMAGE_REDACT as T, toUserMessage } from '../content/strings.js'
import { openImage, drawToCanvas, buildRedactedImage } from '../lib/imageRedact.js'

// Areas are fractions of the photo (0..1, top-left origin), so what is covered
// on screen is covered in the file whatever the zoom. See src/lib/imageRedact.js.

const ZOOMS = [0.5, 0.75, 1, 1.5, 2]

let seq = 0
const nextId = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `a${++seq}`

export default function ImageRedactEditor() {
  const [file, setFile] = useState(null)
  const [image, setImage] = useState(null)
  const [zoom, setZoom] = useState(1)
  const [containerW, setContainerW] = useState(760)

  const [areas, setAreas] = useState([])
  const [past, setPast] = useState([])
  const [future, setFuture] = useState([])
  const [mode, setMode] = useState('draw')
  const [color, setColor] = useState('black')
  const [selectedId, setSelectedId] = useState(null)
  const [draft, setDraft] = useState(null)

  const [format, setFormat] = useState('jpeg')
  const [quality, setQuality] = useState(0.92)
  const [outName, setOutName] = useState('')
  const [resultUrl, setResultUrl] = useState(null)

  const canvasRef = useRef(null)
  const surfaceRef = useRef(null)
  const wrapRef = useRef(null)
  const loadJob = useJob()
  const saveJob = useJob()

  const commit = useCallback(
    (next) => {
      setPast((p) => [...p, areas])
      setFuture([])
      setAreas(next)
      // The finished photo describes areas that are no longer on screen.
      saveJob.reset()
    },
    [areas, saveJob],
  )
  const undo = () => {
    setPast((p) => {
      if (!p.length) return p
      setFuture((f) => [areas, ...f])
      setAreas(p[p.length - 1])
      return p.slice(0, -1)
    })
    setSelectedId(null)
    saveJob.reset()
  }
  const redo = () => {
    setFuture((f) => {
      if (!f.length) return f
      setPast((p) => [...p, areas])
      setAreas(f[0])
      return f.slice(1)
    })
    setSelectedId(null)
    saveJob.reset()
  }

  useEffect(() => () => resultUrl && URL.revokeObjectURL(resultUrl), [resultUrl])

  const pick = async (files) => {
    const f = files[0]
    setFile(f)
    setImage(null)
    setAreas([])
    setPast([])
    setFuture([])
    setSelectedId(null)
    setOutName(`${baseName(f.name)}-가림`)
    saveJob.reset()
    const opened = await loadJob.run(() => openImage(f))
    if (opened) setImage(opened)
  }

  const reset = () => {
    setFile(null)
    setImage(null)
    setAreas([])
    setPast([])
    setFuture([])
    setSelectedId(null)
    saveJob.reset()
    loadJob.reset()
  }

  // Responsive width.
  useEffect(() => {
    if (!wrapRef.current) return
    const ro = new ResizeObserver((entries) => {
      setContainerW(Math.max(280, Math.floor(entries[0].contentRect.width) - 24))
    })
    ro.observe(wrapRef.current)
    return () => ro.disconnect()
  }, [file])

  // Draw the photo whenever it, the zoom or the width changes. Only the
  // backing-store size is set here; CSS stretches the canvas to its parent and
  // the overlay fills the same parent, so the two cannot disagree.
  useEffect(() => {
    if (!image || !canvasRef.current) return
    const cssWidth = Math.min(containerW, 900) * zoom
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    drawToCanvas(image, (cssWidth / image.width) * dpr, canvasRef.current)
  }, [image, zoom, containerW])

  useEffect(() => {
    const onKey = (e) => {
      const el = document.activeElement
      if (el && (el.isContentEditable || el.tagName === 'INPUT')) return
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId) {
        e.preventDefault()
        commit(areas.filter((a) => a.id !== selectedId))
        setSelectedId(null)
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault()
        e.shiftKey ? redo() : undo()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  // ── drawing ──────────────────────────────────────────────────────────────
  const toFraction = (e) => {
    const r = surfaceRef.current.getBoundingClientRect()
    return {
      x: Math.min(Math.max((e.clientX - r.left) / r.width, 0), 1),
      y: Math.min(Math.max((e.clientY - r.top) / r.height, 0), 1),
    }
  }

  const onSurfaceMove = (e) => {
    const p = toFraction(e)
    setDraft((d) =>
      d && {
        ...d,
        x: Math.min(d.ox, p.x),
        y: Math.min(d.oy, p.y),
        w: Math.abs(p.x - d.ox),
        h: Math.abs(p.y - d.oy),
      },
    )
  }
  const onSurfaceUp = () => {
    window.removeEventListener('pointermove', onSurfaceMove)
    window.removeEventListener('pointerup', onSurfaceUp)
    setDraft((d) => {
      if (d && d.w > MIN_FRACTION && d.h > MIN_FRACTION) {
        commit([...areas, { id: nextId(), x: d.x, y: d.y, w: d.w, h: d.h, color }])
      }
      return null
    })
  }
  const onSurfaceDown = (e) => {
    if (!image) return
    if (mode === 'select') {
      if (e.target === surfaceRef.current) setSelectedId(null)
      return
    }
    e.preventDefault()
    const p = toFraction(e)
    setDraft({ ox: p.x, oy: p.y, x: p.x, y: p.y, w: 0, h: 0 })
    window.addEventListener('pointermove', onSurfaceMove)
    window.addEventListener('pointerup', onSurfaceUp)
  }

  const updateArea = (id, patch) =>
    setAreas((prev) => prev.map((a) => (a.id === id ? { ...a, ...patch } : a)))

  const ext = format === 'png' ? 'png' : 'jpg'
  const finalName = () => {
    const n = (outName || '가림').trim()
    return n.toLowerCase().endsWith(`.${ext}`) ? n : `${n}.${ext}`
  }

  const doSave = () =>
    saveJob.run(async (onProgress) => {
      onProgress?.(0.3, T.building)
      const blob = await buildRedactedImage(image, areas, { format, quality })
      if (resultUrl) URL.revokeObjectURL(resultUrl)
      setResultUrl(URL.createObjectURL(blob))
      onProgress?.(1, null)
      return { blob }
    })

  const displayW = Math.min(containerW, 900) * zoom

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600 dark:text-slate-300">{T.verifyNote}</p>

      {!file && (
        <Dropzone onFiles={pick} accept="image/*" multiple={false} label={T.dropLabel} hint={T.dropHint} icon="image" />
      )}

      {loadJob.running && <Progress message={T.opening} />}
      {loadJob.error && <Note type="error" title={T.openFailed}>{toUserMessage(loadJob.error)}</Note>}

      {image && (
        <>
          <div className="card flex flex-wrap items-center gap-2 p-2">
            {[
              ['draw', T.areaTool, T.areaToolHint, 'square'],
              ['select', T.selectTool, T.selectToolHint, 'cursor'],
            ].map(([v, label, hint, icon]) => (
              <button
                key={v}
                type="button"
                title={hint}
                onClick={() => setMode(v)}
                className={
                  'flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm ' +
                  (mode === v ? 'bg-brand-600 text-white' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800')
                }
              >
                <Icon name={icon} className="h-4 w-4" />
                {label}
              </button>
            ))}

            <div className="mx-1 h-6 w-px bg-slate-200 dark:bg-slate-700" />

            {[['black', '검정'], ['white', '흰색']].map(([c, label]) => (
              <button
                key={c}
                type="button"
                onClick={() => {
                  setColor(c)
                  if (selectedId) commit(areas.map((a) => (a.id === selectedId ? { ...a, color: c } : a)))
                }}
                className={'flex h-8 items-center gap-1.5 rounded-lg border px-2 text-xs ' + (color === c ? 'border-brand-600 font-medium' : 'border-slate-300 dark:border-slate-600')}
              >
                <span className="h-4 w-4 rounded border border-slate-400" style={{ background: c === 'white' ? '#fff' : '#000' }} />
                {label}
              </button>
            ))}

            <div className="mx-1 h-6 w-px bg-slate-200 dark:bg-slate-700" />

            <button type="button" className="btn-ghost h-9 px-2" onClick={undo} disabled={!past.length}>
              <Icon name="undo" className="h-4 w-4" /> {COMMON.undo}
            </button>
            <button type="button" className="btn-ghost h-9 px-2" onClick={redo} disabled={!future.length}>
              <Icon name="undo" className="h-4 w-4 scale-x-[-1]" /> {COMMON.redo}
            </button>
            {selectedId && (
              <button type="button" className="btn-ghost h-9 px-2 text-red-600" onClick={() => { commit(areas.filter((a) => a.id !== selectedId)); setSelectedId(null) }}>
                <Icon name="trash" className="h-4 w-4" /> {COMMON.delete}
              </button>
            )}
            {areas.length > 0 && (
              <button type="button" className="btn-ghost h-9 px-2" onClick={() => { commit([]); setSelectedId(null) }}>
                {COMMON.clearAll}
              </button>
            )}

            <div className="ml-auto flex items-center gap-1">
              <button type="button" className="btn-ghost h-9 px-2" onClick={() => setZoom((z) => ZOOMS[Math.max(0, ZOOMS.indexOf(z) - 1)] ?? z)} disabled={zoom === ZOOMS[0]} aria-label={COMMON.zoomOut}>
                <Icon name="minus" className="h-4 w-4" />
              </button>
              <span className="w-12 text-center text-xs tabular-nums text-slate-500">{Math.round(zoom * 100)}%</span>
              <button type="button" className="btn-ghost h-9 px-2" onClick={() => setZoom((z) => ZOOMS[Math.min(ZOOMS.length - 1, ZOOMS.indexOf(z) + 1)] ?? z)} disabled={zoom === ZOOMS[ZOOMS.length - 1]} aria-label={COMMON.zoomIn}>
                <Icon name="plus" className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div ref={wrapRef} className="flex justify-center overflow-auto rounded-xl bg-slate-200/60 p-3 dark:bg-slate-800/40">
            <div
              className="relative max-w-full shadow-lg"
              style={{ width: displayW, aspectRatio: `${image.width} / ${image.height}` }}
            >
              <canvas ref={canvasRef} className="absolute inset-0 h-full w-full rounded-sm" />
              <div
                ref={surfaceRef}
                onPointerDown={onSurfaceDown}
                className="absolute inset-0"
                style={{ cursor: mode === 'draw' ? 'crosshair' : 'default', touchAction: 'none' }}
              >
                {areas.map((a) => (
                  <AreaBox
                    key={a.id}
                    area={a}
                    selected={selectedId === a.id}
                    selectMode={mode === 'select'}
                    onSelect={setSelectedId}
                    onChange={updateArea}
                    surfaceRef={surfaceRef}
                  />
                ))}
                {draft && (
                  <div
                    className="pointer-events-none absolute"
                    style={{
                      left: `${draft.x * 100}%`,
                      top: `${draft.y * 100}%`,
                      width: `${draft.w * 100}%`,
                      height: `${draft.h * 100}%`,
                      background: color === 'white' ? 'rgba(255,255,255,.85)' : 'rgba(0,0,0,.85)',
                      outline: '2px dashed #B85512',
                    }}
                  />
                )}
              </div>
            </div>
          </div>

          <p className="text-center text-sm text-slate-500 dark:text-slate-400">
            {areas.length === 0 ? T.emptyState : T.areaCount(areas.length)}
          </p>

          <div className="card space-y-3 p-4">
            <label className="block space-y-1">
              <span className="field-label">{T.format}</span>
              <div className="flex gap-2">
                {[['jpeg', T.jpeg], ['png', T.png]].map(([v, label]) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => { setFormat(v); saveJob.reset() }}
                    className={'rounded-lg border px-3 py-1.5 text-sm ' + (format === v ? 'border-brand-600 bg-brand-50 font-medium text-brand-700 dark:bg-brand-900/30 dark:text-brand-200' : 'border-slate-300 dark:border-slate-600')}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </label>

            {format === 'jpeg' && (
              <label className="block space-y-1">
                <span className="field-label">{T.quality(Math.round(quality * 100))}</span>
                <input
                  type="range"
                  min="0.5"
                  max="1"
                  step="0.02"
                  value={quality}
                  onChange={(e) => { setQuality(Number(e.target.value)); saveJob.reset() }}
                  className="w-full accent-brand-600"
                />
              </label>
            )}

            <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
              {T.saveNote} {T.metadataNote}
            </p>

            <div className="flex flex-wrap items-center gap-3">
              {!saveJob.result && (
                <button
                  type="button"
                  className="btn-primary"
                  onClick={doSave}
                  disabled={saveJob.running || areas.length === 0}
                  title={areas.length === 0 ? T.saveNothing : undefined}
                >
                  <Icon name="shieldCheck" className="h-4 w-4" /> {T.save}
                </button>
              )}
              <button type="button" className="btn-ghost" onClick={reset}>
                {COMMON.reset}
              </button>
            </div>
          </div>

          {saveJob.running && <Progress value={saveJob.progress?.value} message={saveJob.progress?.message || COMMON.working} />}
          {saveJob.error && <Note type="error" title={T.saveFailed}>{toUserMessage(saveJob.error)}</Note>}

          {saveJob.result && !saveJob.running && (
            <div className="card space-y-3 p-4">
              <p className="text-sm font-medium text-brand-700 dark:text-brand-300">{T.ready}</p>
              <label className="block space-y-1">
                <span className="field-label">{T.fileName}</span>
                <input className="field-input" value={outName} onChange={(e) => setOutName(e.target.value)} />
              </label>
              <a className="btn-primary inline-flex" href={resultUrl} download={finalName()}>
                <Icon name="download" className="h-4 w-4" /> {finalName()} 받기
              </a>
              <Note type="info">{T.keepOriginal}</Note>
            </div>
          )}
        </>
      )}
    </div>
  )
}
