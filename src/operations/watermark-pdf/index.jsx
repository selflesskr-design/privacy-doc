import { useState } from 'react'
import Dropzone from '../../components/Dropzone.jsx'
import Progress from '../../components/Progress.jsx'
import Note from '../../components/Note.jsx'
import Icon from '../../components/Icon.jsx'
import DownloadButton from '../../components/DownloadButton.jsx'
import { useJob } from '../../hooks/useJob.js'
import { formatBytes, baseName } from '../../lib/format.js'
import { addWatermark } from './helpers.js'
import { WATERMARK_PDF as T } from '../../content/strings.js'
import { usePdfThumbnail } from '../../hooks/usePdfThumbnail.js'

// A centred stamp wants to span the page; a tile wants to fit many times over.
const DEFAULT_SIZE = { center: 96, tile: 48 }

// Rough advance width, only for spacing the preview tiles. Hangul is about one
// em, Latin around half. helpers.js measures the real font when it stamps.
const estimateWidth = (text, size) =>
  [...text].reduce((w, ch) => w + (/[가-힣]/.test(ch) ? 1 : 0.55), 0) * size

function stamps({ widthPt, heightPt }, text, fontSize, angle, layout) {
  const textW = estimateWidth(text, fontSize)
  if (layout === 'center') {
    const rad = (angle * Math.PI) / 180
    return [
      {
        x: widthPt / 2 - (textW / 2) * Math.cos(rad),
        y: heightPt - (heightPt / 2 - (textW / 2) * Math.sin(rad)),
      },
    ]
  }
  const stepX = Math.max(textW + 60, 160)
  const stepY = Math.max(fontSize * 3, 120)
  const out = []
  for (let y = -stepY; y < heightPt + stepY; y += stepY) {
    for (let x = -stepX; x < widthPt + stepX; x += stepX) out.push({ x, y: heightPt - y })
  }
  return out
}

export default function WatermarkPdf() {
  const [file, setFile] = useState(null)
  const [text, setText] = useState(T.defaultText)
  const [fontSize, setFontSize] = useState(DEFAULT_SIZE.center)
  const [opacity, setOpacity] = useState(0.25)
  const [angle, setAngle] = useState(45)
  const [color, setColor] = useState('#888888')
  const [layout, setLayout] = useState('center')
  const [sizeTouched, setSizeTouched] = useState(false)
  const { running, progress, error, result, run, reset } = useJob()
  const preview = usePdfThumbnail(file, { width: 260 })

  const pick = (files) => {
    setFile(files[0])
    reset()
  }
  // Settings changed means the stamped file no longer matches the form.
  const setOption = (set) => (e) => {
    set(e.target.value)
    reset()
  }
  const chooseLayout = (e) => {
    const next = e.target.value
    setLayout(next)
    if (!sizeTouched) setFontSize(DEFAULT_SIZE[next])
    reset()
  }
  const changeSize = (e) => {
    setSizeTouched(true)
    setFontSize(e.target.value)
    reset()
  }
  const go = () =>
    run((p) =>
      addWatermark(file, { text, fontSize: Number(fontSize), opacity: Number(opacity), angle: Number(angle), color, layout }, p).then(
        (blob) => ({ blob, filename: `${baseName(file.name)}-watermarked.pdf` }),
      ),
    )

  return (
    <div className="space-y-6">
      <Dropzone onFiles={pick} accept="application/pdf,.pdf" multiple={false} label={T.dropLabel} icon="fileText" />

      {file && (
        <>
          <div className="card flex items-center gap-3 p-3">
            <Icon name="fileText" className="h-5 w-5 text-brand-600" />
            <span className="min-w-0 flex-1 truncate text-sm font-medium">{file.name}</span>
            <span className="text-xs text-slate-400">{formatBytes(file.size)}</span>
          </div>

          <div className="card space-y-4 p-4">
            <label className="block space-y-1">
              <span className="field-label">{T.text}</span>
              <input className="field-input" value={text} onChange={setOption(setText)} />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-1">
                <span className="field-label">{T.layout}</span>
                <select className="field-input" value={layout} onChange={chooseLayout}>
                  <option value="center">{T.center}</option>
                  <option value="tile">{T.tile}</option>
                </select>
              </label>
              <label className="space-y-1">
                <span className="field-label">{T.color}</span>
                <input type="color" className="field-input h-[42px] p-1" value={color} onChange={setOption(setColor)} />
              </label>
              <label className="space-y-1">
                <span className="field-label">{T.fontSize(fontSize)}</span>
                <input type="range" min="12" max="120" value={fontSize} onChange={changeSize} className="w-full accent-brand-600" />
              </label>
              <label className="space-y-1">
                <span className="field-label">{T.opacity(Math.round(opacity * 100))}</span>
                <input type="range" min="0.05" max="1" step="0.05" value={opacity} onChange={setOption(setOpacity)} className="w-full accent-brand-600" />
              </label>
              <label className="space-y-1">
                <span className="field-label">{T.angle(angle)}</span>
                <input type="range" min="0" max="90" value={angle} onChange={setOption(setAngle)} className="w-full accent-brand-600" />
              </label>
            </div>
          </div>

          <div className="card space-y-2 p-4">
            <span className="field-label">{T.preview}</span>
            <div className="flex justify-center rounded-lg bg-slate-100 p-3 dark:bg-slate-800">
              {preview ? (
                <div className="relative shadow-sm">
                  <img src={preview.url} alt="" className="block max-w-full" />
                  <svg
                    viewBox={`0 0 ${preview.widthPt} ${preview.heightPt}`}
                    className="absolute inset-0 h-full w-full"
                    aria-hidden="true"
                  >
                    {stamps(preview, text, Number(fontSize), Number(angle), layout).map((s, i) => (
                      <text
                        key={i}
                        x={s.x}
                        y={s.y}
                        fill={color}
                        fillOpacity={opacity}
                        fontSize={fontSize}
                        fontWeight="bold"
                        transform={`rotate(${-angle} ${s.x} ${s.y})`}
                      >
                        {text}
                      </text>
                    ))}
                  </svg>
                </div>
              ) : (
                <span className="py-8 text-xs text-slate-400">{T.previewLoading}</span>
              )}
            </div>
            <span className="text-xs text-slate-500">{T.previewNote}</span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {result ? (
              <DownloadButton result={result} />
            ) : (
              <button type="button" className="btn-primary" onClick={go} disabled={running}>
                <Icon name="droplet" className="h-4 w-4" />
                {T.apply}
              </button>
            )}
          </div>
        </>
      )}

      {running && progress && <Progress value={progress.value} message={progress.message} />}
      {error && <Note type="error" title={T.failed}>{error}</Note>}
    </div>
  )
}
