import { useState, useMemo } from 'react'
import Dropzone from '../../components/Dropzone.jsx'
import Progress from '../../components/Progress.jsx'
import Note from '../../components/Note.jsx'
import Icon from '../../components/Icon.jsx'
import DownloadButton from '../../components/DownloadButton.jsx'
import { useJob } from '../../hooks/useJob.js'
import { formatBytes, baseName, parsePageRanges } from '../../lib/format.js'
import { rotatePdf } from './helpers.js'
import { usePdfPageCount } from '../../hooks/usePdfPageCount.js'
import { usePdfThumbnail } from '../../hooks/usePdfThumbnail.js'
import { ROTATE_PDF as T } from '../../content/strings.js'

export default function RotatePdf() {
  const [file, setFile] = useState(null)
  const [angle, setAngle] = useState(90)
  const [range, setRange] = useState('')
  const { running, progress, error, result, run, reset } = useJob()
  const { pageCount } = usePdfPageCount(file)
  const thumbnail = usePdfThumbnail(file)

  // Range is optional here — empty means "all pages" and is valid. Only
  // validate (and only show an error) once the user has typed something.
  const rangeError = useMemo(() => {
    if (!range.trim() || pageCount == null) return null
    const groups = range.split(',').map((s) => s.trim()).filter(Boolean)
    for (const g of groups) {
      try {
        const pages = parsePageRanges(g, pageCount)
        if (!pages.length) return T.rangeEmpty(g, pageCount)
      } catch (err) {
        return err.message
      }
    }
    return null
  }, [range, pageCount])

  const pick = (files) => {
    setFile(files[0])
    reset()
  }
  // A finished file no longer matches a changed angle or page list.
  const chooseAngle = (next) => {
    setAngle(next)
    reset()
  }
  const editRange = (next) => {
    setRange(next)
    reset()
  }
  const go = () =>
    run((p) =>
      rotatePdf(file, { angle: Number(angle), range }, p).then((blob) => ({
        blob,
        filename: `${baseName(file.name)}-rotated.pdf`,
      })),
    )

  return (
    <div className="space-y-6">
      <Dropzone onFiles={pick} accept="application/pdf,.pdf" multiple={false} label={T.dropLabel} />

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
                <span className="field-label">{T.angle}</span>
                <select
                  className="field-input"
                  value={angle}
                  onChange={(e) => chooseAngle(e.target.value)}
                >
                  <option value={90}>{T.cw90}</option>
                  <option value={180}>{T.deg180}</option>
                  <option value={270}>{T.ccw90}</option>
                </select>
              </label>
              <label className="space-y-1">
                <span className="field-label">{T.range}</span>
                <input
                  className="field-input"
                  placeholder={T.rangePlaceholder}
                  value={range}
                  onChange={(e) => editRange(e.target.value)}
                  aria-invalid={!!rangeError}
                />
                {rangeError && <span className="block text-xs text-red-600 dark:text-red-400">{rangeError}</span>}
              </label>
            </div>
          </div>

          <div className="card space-y-2 p-4">
            <span className="field-label">{T.preview}</span>
            <div className="flex h-52 items-center justify-center overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-800">
              {thumbnail ? (
                <img
                  src={thumbnail}
                  alt=""
                  className="max-h-full max-w-full shadow-sm transition-transform duration-200"
                  style={{ transform: `rotate(${Number(angle)}deg)` }}
                />
              ) : (
                <span className="text-xs text-slate-400">{T.previewLoading}</span>
              )}
            </div>
            <span className="text-xs text-slate-500">{T.previewNote}</span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {result ? (
              <DownloadButton result={result} />
            ) : (
              <button type="button" className="btn-primary" onClick={go} disabled={running || !!rangeError}>
                <Icon name="rotate" className="h-4 w-4" />
                {T.rotate}
              </button>
            )}
          </div>
        </>
      )}

      {running && progress && <Progress value={progress.value} message={progress.message} />}
      {error && (
        <Note type="error" title={T.failed}>
          {error}
        </Note>
      )}
    </div>
  )
}
