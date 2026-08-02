import { useState, useRef, useEffect, useCallback } from 'react'
import Dropzone from '../components/Dropzone.jsx'
import Progress from '../components/Progress.jsx'
import Note from '../components/Note.jsx'
import Icon from '../components/Icon.jsx'
import AreaBox, { MIN_FRACTION } from '../components/AreaBox.jsx'
import { useJob } from '../hooks/useJob.js'
import { baseName } from '../lib/format.js'
import { COMMON, PDF_REDACT, toUserMessage } from '../content/strings.js'
import { openPdf, pageBox, renderPageToCanvas, buildRedactedPdf } from '../lib/redact.js'

// Areas live as fractions of the page box (0..1, top-left origin), so zoom,
// device pixel ratio and export DPI cannot shift them. See src/lib/redact.js.

const ZOOMS = [0.5, 0.75, 1, 1.5, 2]

let seq = 0
const nextId = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `a${++seq}`

export default function PdfRedactEditor() {
  const [file, setFile] = useState(null)
  const [pdf, setPdf] = useState(null)
  const [numPages, setNumPages] = useState(0)
  const [pageIndex, setPageIndex] = useState(0)
  const [box, setBox] = useState(null) // page size in points, rotation applied
  const [zoom, setZoom] = useState(1)
  const [containerW, setContainerW] = useState(760)

  const [areas, setAreas] = useState([]) // { id, page, x, y, w, h, color }
  const [past, setPast] = useState([])
  const [future, setFuture] = useState([])
  const [mode, setMode] = useState('draw') // 'draw' | 'select'
  const [color, setColor] = useState('black')
  const [selectedId, setSelectedId] = useState(null)
  const [draft, setDraft] = useState(null)

  const [quality, setQuality] = useState('high')
  const [outName, setOutName] = useState('')

  const [resultUrl, setResultUrl] = useState(null)

  const canvasRef = useRef(null)
  const surfaceRef = useRef(null)
  const wrapRef = useRef(null)
  const loadJob = useJob()
  const saveJob = useJob()

  // Object URL for the finished file, revoked when it is replaced or the editor
  // resets so a long session does not hold every result in memory.
  useEffect(() => {
    const blob = saveJob.result?.blob
    if (!blob) {
      setResultUrl(null)
      return undefined
    }
    const url = URL.createObjectURL(blob)
    setResultUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [saveJob.result])

  // ── history ──────────────────────────────────────────────────────────────
  // Any change to the areas throws away the built PDF. Without this, drawing
  // one more box after saving left the earlier file — the one missing that box
  // — on the download button, with nothing on screen to say so.
  const commit = useCallback((next) => {
    setPast((p) => [...p, areas])
    setFuture([])
    setAreas(next)
    saveJob.reset()
  }, [areas, saveJob])

  const undo = () => {
    if (!past.length) return
    setFuture((f) => [areas, ...f])
    setAreas(past[past.length - 1])
    setPast((p) => p.slice(0, -1))
    setSelectedId(null)
    saveJob.reset()
  }
  const redo = () => {
    if (!future.length) return
    setPast((p) => [...p, areas])
    setAreas(future[0])
    setFuture((f) => f.slice(1))
    setSelectedId(null)
    saveJob.reset()
  }

  // ── file ─────────────────────────────────────────────────────────────────
  const pick = async (files) => {
    const f = files[0]
    if (!f) return
    setFile(f)
    setOutName(`${baseName(f.name)}-가림.pdf`)
    setAreas([])
    setPast([])
    setFuture([])
    setSelectedId(null)
    setPageIndex(0)
    saveJob.reset()
    const doc = await loadJob.run(async () => await openPdf(f))
    if (doc) {
      setPdf(doc)
      setNumPages(doc.numPages)
    }
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

  // Render the current page whenever it, the zoom or the width changes.
  useEffect(() => {
    if (!pdf || !canvasRef.current) return
    let cancelled = false
    ;(async () => {
      const page = await pdf.getPage(pageIndex + 1)
      const b = pageBox(page)
      if (cancelled) return
      setBox(b)
      // Only the backing-store resolution is set here. The canvas is stretched
      // to its parent by CSS (inset-0, h-full w-full) and the overlay fills the
      // same parent, so the two can never disagree — which is what keeps a
      // covered area landing exactly where the user drew it.
      const cssWidth = Math.min(containerW, 900) * zoom
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      await renderPageToCanvas(page, (cssWidth / b.width) * dpr, canvasRef.current)
      if (cancelled) return
      page.cleanup?.()
    })()
    return () => {
      cancelled = true
    }
  }, [pdf, pageIndex, zoom, containerW])

  // Delete key removes the selected area.
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

  const onSurfaceDown = (e) => {
    if (!box) return
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
  const onSurfaceMove = (e) => {
    setDraft((d) => {
      if (!d) return d
      const p = toFraction(e)
      return {
        ...d,
        x: Math.min(d.ox, p.x),
        y: Math.min(d.oy, p.y),
        w: Math.abs(p.x - d.ox),
        h: Math.abs(p.y - d.oy),
      }
    })
  }
  const onSurfaceUp = () => {
    window.removeEventListener('pointermove', onSurfaceMove)
    window.removeEventListener('pointerup', onSurfaceUp)
    setDraft((d) => {
      if (d && d.w > MIN_FRACTION && d.h > MIN_FRACTION) {
        const area = { id: nextId(), page: pageIndex, x: d.x, y: d.y, w: d.w, h: d.h, color }
        setPast((p) => [...p, areasRef.current])
        setFuture([])
        setAreas((prev) => [...prev, area])
      }
      return null
    })
  }
  // onSurfaceUp runs outside React's render, so it needs the latest areas.
  const areasRef = useRef(areas)
  useEffect(() => {
    areasRef.current = areas
  }, [areas])

  const updateArea = (id, patch) =>
    setAreas((prev) => prev.map((a) => (a.id === id ? { ...a, ...patch } : a)))

  const pageAreas = areas.filter((a) => a.page === pageIndex)

  // ── save ─────────────────────────────────────────────────────────────────
  const finalName = () => {
    let n = (outName || `${baseName(file.name)}-가림`).trim().replace(/[\\/:*?"<>|]/g, '_')
    if (!/\.pdf$/i.test(n)) n += '.pdf'
    return n
  }

  const doSave = () => {
    const byPage = {}
    for (const a of areas) (byPage[a.page] ||= []).push(a)
    saveJob.run((setProgress) =>
      buildRedactedPdf(file, byPage, { quality }, (value, page) => {
        setProgress(
          value,
          page ? PDF_REDACT.converting(page, numPages) : PDF_REDACT.building,
        )
      }).then((blob) => ({ blob })),
    )
  }

  const reset = () => {
    setFile(null)
    setPdf(null)
    setBox(null)
    setAreas([])
    setPast([])
    setFuture([])
    setSelectedId(null)
    saveJob.reset()
    loadJob.reset()
  }

  const displayW = Math.min(containerW, 900) * zoom

  const toolBtn = (active) =>
    'flex h-10 items-center gap-1.5 rounded-lg px-3 text-sm font-medium transition-colors ' +
    (active
      ? 'bg-brand-600 text-white'
      : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800')

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <span className="rounded-full bg-brand-100 px-2.5 py-0.5 text-xs font-semibold text-brand-800 dark:bg-brand-900/50 dark:text-brand-200">
          {PDF_REDACT.beta}
        </span>
        <span className="text-xs text-slate-500 dark:text-slate-400">{PDF_REDACT.betaNote}</span>
      </div>

      {!file && (
        <>
          <Dropzone
            onFiles={pick}
            accept="application/pdf,.pdf"
            multiple={false}
            label={PDF_REDACT.dropLabel}
            hint={PDF_REDACT.dropHint}
          />
          <Note type="warning">{PDF_REDACT.checkFirst}</Note>
        </>
      )}

      {loadJob.running && <Progress message={PDF_REDACT.opening} />}
      {loadJob.error && <Note type="error">{loadJob.error}</Note>}

      {file && pdf && (
        <>
          {/* Toolbar */}
          <div className="card flex flex-wrap items-center gap-2 p-2">
            <button type="button" className={toolBtn(mode === 'draw')} onClick={() => { setMode('draw'); setSelectedId(null) }} title={PDF_REDACT.areaToolHint}>
              <Icon name="square" className="h-[18px] w-[18px]" />
              {PDF_REDACT.areaTool}
            </button>
            <button type="button" className={toolBtn(mode === 'select')} onClick={() => setMode('select')} title={PDF_REDACT.selectToolHint}>
              <Icon name="cursor" className="h-[18px] w-[18px]" />
              {PDF_REDACT.selectTool}
            </button>

            <div className="mx-1 h-6 w-px bg-slate-200 dark:bg-slate-700" />

            <div className="flex items-center gap-1" role="radiogroup" aria-label="가림 색">
              {[['black', '검정'], ['white', '흰색']].map(([c, label]) => (
                <button
                  key={c}
                  type="button"
                  role="radio"
                  aria-checked={color === c}
                  onClick={() => { setColor(c); if (selectedId) { commit(areas.map((a) => (a.id === selectedId ? { ...a, color: c } : a))) } }}
                  className={'flex h-8 items-center gap-1.5 rounded-lg border px-2 text-xs ' + (color === c ? 'border-brand-600 font-medium' : 'border-slate-300 dark:border-slate-600')}
                >
                  <span className="h-4 w-4 rounded border border-slate-400" style={{ background: c === 'white' ? '#fff' : '#000' }} />
                  {label}
                </button>
              ))}
            </div>

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

          {/* Page nav */}
          {numPages > 1 && (
            <div className="flex items-center justify-center gap-4 text-sm">
              <button type="button" className="btn-secondary px-3 py-1" disabled={pageIndex === 0} onClick={() => { setPageIndex((i) => i - 1); setSelectedId(null) }}>
                <Icon name="arrowUp" className="h-4 w-4 -rotate-90" /> {COMMON.prevPage}
              </button>
              <span className="tabular-nums text-slate-500">{PDF_REDACT.pageOf(pageIndex + 1, numPages)}</span>
              <button type="button" className="btn-secondary px-3 py-1" disabled={pageIndex >= numPages - 1} onClick={() => { setPageIndex((i) => i + 1); setSelectedId(null) }}>
                {COMMON.nextPage} <Icon name="arrowDown" className="h-4 w-4 -rotate-90" />
              </button>
            </div>
          )}

          {/* Page surface */}
          <div ref={wrapRef} className="flex justify-center overflow-auto rounded-xl bg-slate-200/60 p-3 dark:bg-slate-800/40">
            {/* aspectRatio, not a fixed height: when a narrow screen clamps the
                width, the height has to follow or the page renders squashed. */}
            <div
              className="relative max-w-full shadow-lg"
              style={{
                width: displayW,
                aspectRatio: box ? `${box.width} / ${box.height}` : '1 / 1.3',
              }}
            >
              <canvas ref={canvasRef} className="absolute inset-0 h-full w-full rounded-sm" />
              <div
                ref={surfaceRef}
                onPointerDown={onSurfaceDown}
                className="absolute inset-0"
                style={{ cursor: mode === 'draw' ? 'crosshair' : 'default', touchAction: 'none' }}
              >
                {pageAreas.map((a) => (
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
            {areas.length === 0 ? PDF_REDACT.emptyState : PDF_REDACT.areaCount(areas.length)}
            {areas.length > 0 && numPages > 1 && ` · ${PDF_REDACT.areaCountOnPage(pageAreas.length)}`}
          </p>

          {/* Save */}
          <div className="card space-y-3 p-4">
            <label className="block space-y-1">
              <span className="field-label">{PDF_REDACT.quality}</span>
              <div className="flex gap-2">
                {[['normal', PDF_REDACT.qualityNormal], ['high', PDF_REDACT.qualityHigh], ['max', PDF_REDACT.qualityMax]].map(([v, label]) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setQuality(v)}
                    className={'rounded-lg border px-3 py-1.5 text-sm ' + (quality === v ? 'border-brand-600 bg-brand-50 font-medium text-brand-700 dark:bg-brand-900/30 dark:text-brand-200' : 'border-slate-300 dark:border-slate-600')}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <span className="block text-xs text-slate-500">{PDF_REDACT.qualityHint}</span>
            </label>

            <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
              {PDF_REDACT.saveNote}
            </p>

            <div className="flex flex-wrap items-center gap-3">
              {!saveJob.result && (
                <button
                  type="button"
                  className="btn-primary"
                  onClick={doSave}
                  disabled={saveJob.running || areas.length === 0}
                  title={areas.length === 0 ? PDF_REDACT.saveNothing : undefined}
                >
                  <Icon name="shieldCheck" className="h-4 w-4" /> {PDF_REDACT.save}
                </button>
              )}
              <button type="button" className="btn-ghost" onClick={reset}>
                {COMMON.reset}
              </button>
            </div>
          </div>

          {saveJob.running && <Progress value={saveJob.progress?.value} message={saveJob.progress?.message || COMMON.working} />}
          {saveJob.error && <Note type="error">{saveJob.error}</Note>}

          {saveJob.result && !saveJob.running && (
            <div className="card space-y-3 p-4">
              <p className="text-sm font-medium text-brand-700 dark:text-brand-300">{PDF_REDACT.ready}</p>
              <label className="block space-y-1">
                <span className="field-label">{PDF_REDACT.fileName}</span>
                <input className="field-input" value={outName} onChange={(e) => setOutName(e.target.value)} />
              </label>
              {/* A real anchor the user clicks, not a synthetic click from
                  script. Chrome throttles repeated script-driven downloads from
                  one page — saving a second file would silently do nothing. */}
              <a className="btn-primary inline-flex" href={resultUrl} download={finalName()}>
                <Icon name="download" className="h-4 w-4" /> {COMMON.download}
              </a>
              <Note type="info">{PDF_REDACT.keepOriginal}</Note>
              <Note type="info">{PDF_REDACT.afterNote}</Note>
            </div>
          )}
        </>
      )}

    </div>
  )
}

export { toUserMessage }
