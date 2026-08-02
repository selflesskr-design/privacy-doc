import { useState, useMemo } from 'react'
import Dropzone from '../../components/Dropzone.jsx'
import Progress from '../../components/Progress.jsx'
import Note from '../../components/Note.jsx'
import Icon from '../../components/Icon.jsx'
import ResultGallery from '../../components/ResultGallery.jsx'
import { useJob } from '../../hooks/useJob.js'
import { formatBytes, baseName, parsePageRanges } from '../../lib/format.js'
import { splitPdf } from './helpers.js'
import { usePdfPageCount } from '../../hooks/usePdfPageCount.js'
import { SPLIT_PDF as T, COMMON } from '../../content/strings.js'

export default function SplitPdf() {
  const [file, setFile] = useState(null)
  const [mode, setMode] = useState('explode')
  const [ranges, setRanges] = useState('')
  const { running, progress, error, result, run, reset } = useJob()
  const { pageCount } = usePdfPageCount(file)

  // Validate the ranges input as the user types, using the same parser the
  // job itself uses, so an invalid range is caught before "Split PDF" runs
  // instead of failing partway through the job.
  const rangeError = useMemo(() => {
    if (mode !== 'ranges' || !ranges.trim() || pageCount == null) return null
    const groups = ranges.split(',').map((s) => s.trim()).filter(Boolean)
    for (const g of groups) {
      try {
        const pages = parsePageRanges(g, pageCount)
        if (!pages.length) return T.rangeEmpty(g, pageCount)
      } catch (err) {
        return err.message
      }
    }
    return null
  }, [mode, ranges, pageCount])

  const pick = (files) => {
    setFile(files[0])
    reset()
  }
  // Changing how it splits makes the finished list describe a split nobody
  // asked for any more.
  const chooseMode = (next) => {
    setMode(next)
    reset()
  }
  const editRanges = (next) => {
    setRanges(next)
    reset()
  }
  const go = () => run((p) => splitPdf(file, { mode, ranges }, p))

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

          <div className="card space-y-4 p-4">
            <fieldset className="space-y-2">
              <legend className="field-label mb-1">{T.mode}</legend>
              <label className="flex items-center gap-2 text-sm">
                <input type="radio" name="mode" checked={mode === 'explode'} onChange={() => chooseMode('explode')} />
                {pageCount != null ? T.explodeWith(pageCount) : T.explode}
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="radio" name="mode" checked={mode === 'ranges'} onChange={() => chooseMode('ranges')} />
                {T.ranges}
              </label>
            </fieldset>
            {mode === 'ranges' && (
              <label className="block space-y-1">
                <span className="field-label">{T.rangesLabel}</span>
                <input
                  className="field-input"
                  placeholder={T.rangesPlaceholder}
                  value={ranges}
                  onChange={(e) => editRanges(e.target.value)}
                  aria-invalid={!!rangeError}
                />
                <span className="text-xs text-slate-500">{T.rangesHint}</span>
                {rangeError && <span className="block text-xs text-red-600 dark:text-red-400">{rangeError}</span>}
              </label>
            )}
          </div>

          <button
            type="button"
            className="btn-primary"
            onClick={go}
            disabled={running || (mode === 'ranges' && (!ranges.trim() || !!rangeError))}
          >
            <Icon name="scissors" className="h-4 w-4" />
            Split PDF
          </button>
        </>
      )}

      {running && progress && <Progress value={progress.value} message={progress.message} />}
      {error && <Note type="error" title={T.failed}>{error}</Note>}
      {result && !running && <ResultGallery results={result} preview={false} zipName={`${baseName(file?.name || 'split')}-split.zip`} />}
    </div>
  )
}
