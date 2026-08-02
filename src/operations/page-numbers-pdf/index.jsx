import { useState } from 'react'
import Dropzone from '../../components/Dropzone.jsx'
import Progress from '../../components/Progress.jsx'
import Note from '../../components/Note.jsx'
import Icon from '../../components/Icon.jsx'
import DownloadButton from '../../components/DownloadButton.jsx'
import { useJob } from '../../hooks/useJob.js'
import { formatBytes, baseName } from '../../lib/format.js'
import { addPageNumbers } from './helpers.js'
import { usePdfPageCount } from '../../hooks/usePdfPageCount.js'
import { usePdfThumbnail } from '../../hooks/usePdfThumbnail.js'
import { PAGE_NUMBERS as T } from '../../content/strings.js'

// Mirrors helpers.js: same 28pt margin, same corners. SVG measures y from the
// top, so a bottom number sits at height - margin.
const MARGIN = 28
const anchor = (position) =>
  position.endsWith('right') ? 'end' : position.endsWith('left') ? 'start' : 'middle'
const spotX = (position, widthPt) =>
  position.endsWith('right') ? widthPt - MARGIN : position.endsWith('left') ? MARGIN : widthPt / 2
const spotY = (position, heightPt, fontSize) =>
  position.startsWith('top') ? MARGIN + fontSize : heightPt - MARGIN

// Mirrors label() in helpers.js so the preview shows the real thing.
const sample = (format, n, total) =>
  format === 'n-of-total' ? `${n} / ${total}` : format === 'dashed' ? `- ${n} -` : `${n}`

export default function PageNumbersPdf() {
  const [file, setFile] = useState(null)
  const [position, setPosition] = useState('bottom-center')
  const [format, setFormat] = useState('n')
  const [fontSize, setFontSize] = useState(11)
  const [start, setStart] = useState(1)
  const { running, progress, error, result, run, reset } = useJob()
  const { pageCount } = usePdfPageCount(file)
  const preview = usePdfThumbnail(file, { width: 260 })

  const pick = (files) => {
    setFile(files[0])
    reset()
  }
  const setOption = (set) => (e) => {
    set(e.target.value)
    reset()
  }
  const go = () =>
    run((p) =>
      addPageNumbers(file, { position, format, fontSize: Number(fontSize), start: Number(start) }, p).then((blob) => ({
        blob,
        filename: `${baseName(file.name)}-numbered.pdf`,
      })),
    )

  return (
    <div className="space-y-6">
      <Dropzone onFiles={pick} accept="application/pdf,.pdf" multiple={false} label={T.dropLabel} icon="fileText" />

      {file && (
        <>
          <div className="card flex items-center gap-3 p-3">
            <Icon name="fileText" className="h-5 w-5 text-brand-600" />
            <span className="min-w-0 flex-1 truncate text-sm font-medium">{file.name}</span>
            <span className="text-xs text-slate-400">{formatBytes(file.size)}{pageCount != null && ` · ${T.pages(pageCount)}`}</span>
          </div>

          <div className="card p-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-1">
                <span className="field-label">{T.position}</span>
                <select className="field-input" value={position} onChange={setOption(setPosition)}>
                  <option value="bottom-center">{T.bottomCenter}</option>
                  <option value="bottom-right">{T.bottomRight}</option>
                  <option value="bottom-left">{T.bottomLeft}</option>
                  <option value="top-center">{T.topCenter}</option>
                  <option value="top-right">{T.topRight}</option>
                  <option value="top-left">{T.topLeft}</option>
                </select>
              </label>
              <label className="space-y-1">
                <span className="field-label">{T.format}</span>
                <select className="field-input" value={format} onChange={setOption(setFormat)}>
                  <option value="n">1, 2, 3…</option>
                  <option value="dashed">- 1 -, - 2 -…</option>
                  <option value="n-of-total">1 / 19, 2 / 19…</option>
                </select>
              </label>
              <label className="space-y-1">
                <span className="field-label">{T.fontSize(fontSize)}</span>
                <input type="range" min="8" max="24" value={fontSize} onChange={setOption(setFontSize)} className="w-full accent-brand-600" />
              </label>
              <label className="space-y-1">
                <span className="field-label">{T.start}</span>
                <input type="number" min="0" className="field-input" value={start} onChange={setOption(setStart)} />
                <span className="text-xs text-slate-500">{T.startHint}</span>
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
                    <text
                      x={spotX(position, preview.widthPt)}
                      y={spotY(position, preview.heightPt, Number(fontSize))}
                      textAnchor={anchor(position)}
                      fontSize={fontSize}
                      fill="#111827"
                    >
                      {sample(format, Number(start), (pageCount || 1) + Number(start) - 1)}
                    </text>
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
                <Icon name="hash" className="h-4 w-4" />
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
