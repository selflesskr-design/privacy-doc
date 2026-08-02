import { useState, useMemo } from 'react'
import Dropzone from '../../components/Dropzone.jsx'
import Progress from '../../components/Progress.jsx'
import Note from '../../components/Note.jsx'
import Icon from '../../components/Icon.jsx'
import ResultGallery from '../../components/ResultGallery.jsx'
import { useJob } from '../../hooks/useJob.js'
import { formatBytes, parsePageRanges } from '../../lib/format.js'
import { pdfToImages } from './helpers.js'
import { usePdfPageCount } from '../../hooks/usePdfPageCount.js'
import { PDF_TO_IMAGES as T, COMMON } from '../../content/strings.js'

export default function PdfToImages() {
  const [file, setFile] = useState(null)
  const [format, setFormat] = useState('png')
  const [scale, setScale] = useState(2)
  const [range, setRange] = useState('')
  const { running, progress, error, result, run, reset, slow, cancel } = useJob()
  const { pageCount } = usePdfPageCount(file)

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

  const convert = () =>
    run((onProgress) => pdfToImages(file, { format, scale: Number(scale), range }, onProgress))

  return (
    <div className="space-y-6">
      <Dropzone onFiles={pick} accept="application/pdf,.pdf" multiple={false} label={T.dropLabel} hint={T.dropHint} icon="fileText" />

      {file && (
        <>
          <div className="card flex items-center gap-3 p-3">
            <Icon name="fileText" className="h-5 w-5 text-brand-600" />
            <span className="min-w-0 flex-1 truncate text-sm font-medium">{file.name}</span>
            <span className="text-xs text-slate-400">{formatBytes(file.size)}{pageCount != null && ` · ${T.pages(pageCount)}`}</span>
          </div>

          <div className="card p-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <label className="space-y-1">
                <span className="field-label">{T.format}</span>
                <select className="field-input" value={format} onChange={(e) => setFormat(e.target.value)}>
                  <option value="png">{T.png}</option>
                  <option value="jpeg">{T.jpeg}</option>
                </select>
              </label>
              <label className="space-y-1">
                <span className="field-label">{T.quality}</span>
                <select className="field-input" value={scale} onChange={(e) => setScale(e.target.value)}>
                  <option value={1}>{T.qualityScreen}</option>
                  <option value={2}>{T.qualityHigh}</option>
                  <option value={3}>{T.qualityPrint}</option>
                  <option value={4}>{T.qualityMax}</option>
                </select>
              </label>
              <label className="space-y-1">
                <span className="field-label">{T.range}</span>
                <input
                  className="field-input"
                  placeholder={T.rangePlaceholder}
                  value={range}
                  onChange={(e) => setRange(e.target.value)}
                  aria-invalid={!!rangeError}
                />
                {rangeError && <span className="block text-xs text-red-600 dark:text-red-400">{rangeError}</span>}
              </label>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button type="button" className="btn-primary" onClick={convert} disabled={running || !!rangeError}>
              <Icon name="image" className="h-4 w-4" />
              {T.convert}
            </button>
            {running && slow && (
              <button type="button" onClick={cancel}
                className="flex items-center justify-center gap-1.5 rounded-lg border border-red-500 bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600 hover:border-red-600 transition-colors">
                <Icon name="x" className="h-4 w-4" />
                {COMMON.cancel}
              </button>
            )}
          </div>
        </>
      )}

      {running && progress && <Progress value={progress.value} message={progress.message} />}
      {error && <Note type="error" title={T.failed}>{error}</Note>}
      {result && !running && <ResultGallery results={result} zipName={`${file?.name?.replace(/\.pdf$/i, '') || 'pages'}-images.zip`} />}
    </div>
  )
}
