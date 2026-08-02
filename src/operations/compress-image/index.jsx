import { useState } from 'react'
import Dropzone from '../../components/Dropzone.jsx'
import Progress from '../../components/Progress.jsx'
import Note from '../../components/Note.jsx'
import Icon from '../../components/Icon.jsx'
import ImageResult from '../../components/ImageResult.jsx'
import { useJob } from '../../hooks/useJob.js'
import { formatBytes } from '../../lib/format.js'
import { compressImage } from './helpers.js'
import { COMPRESS_IMAGE as T, COMMON } from '../../content/strings.js'

export default function CompressImage() {
  const [file, setFile] = useState(null)
  const [quality, setQuality] = useState(0.7)
  const [maxDimension, setMaxDimension] = useState(0)
  const [format, setFormat] = useState('keep')
  const { running, slow, progress, error, result, run, reset, cancel } = useJob()

  const pick = (files) => {
    setFile(files[0])
    reset()
  }
  const setOption = (set) => (e) => {
    set(e.target.value)
    reset()
  }
  const go = () => run((p) => compressImage(file, { quality: Number(quality), maxDimension: Number(maxDimension), format }, p))

  return (
    <div className="space-y-6">
      <Dropzone onFiles={pick} accept="image/*" multiple={false} label={T.dropLabel} hint={T.dropHint} icon="image" />

      {file && (
        <>
          <div className="card flex items-center gap-3 p-3">
            <Icon name="image" className="h-5 w-5 text-brand-600" />
            <span className="min-w-0 flex-1 truncate text-sm font-medium">{file.name}</span>
            <span className="text-xs text-slate-400">{formatBytes(file.size)}</span>
          </div>

          <div className="card p-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <label className="space-y-1">
                <span className="field-label">{T.quality(Math.round(quality * 100))}</span>
                <input type="range" min="0.1" max="1" step="0.05" value={quality} onChange={setOption(setQuality)} className="w-full accent-brand-600" />
              </label>
              <label className="space-y-1">
                <span className="field-label">{T.maxSize}</span>
                <select className="field-input" value={maxDimension} onChange={setOption(setMaxDimension)}>
                  <option value={0}>{T.keepSize}</option>
                  <option value={3840}>{T.px3840}</option>
                  <option value={1920}>{T.px1920}</option>
                  <option value={1280}>{T.px1280}</option>
                  <option value={800}>{T.px800}</option>
                </select>
                <span className="text-xs text-slate-500">{T.maxSizeHint}</span>
              </label>
              <label className="space-y-1">
                <span className="field-label">{T.format}</span>
                <select className="field-input" value={format} onChange={setOption(setFormat)}>
                  <option value="keep">{T.keepFormat}</option>
                  <option value="jpeg">JPEG</option>
                  <option value="webp">WebP</option>
                </select>
              </label>
            </div>
            <Note type="info" className="mt-4">{T.pngNote}</Note>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {!result && (
              <button type="button" className="btn-primary" onClick={go} disabled={running}>
                <Icon name="compress" className="h-4 w-4" />
                {T.compress}
              </button>
            )}
            {running && slow && (
              <button
                type="button"
                onClick={cancel}
                className="flex items-center justify-center gap-1.5 rounded-lg border border-red-500 bg-red-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:border-red-600 hover:bg-red-600"
              >
                <Icon name="x" className="h-4 w-4" />
                {COMMON.cancel}
              </button>
            )}
          </div>
        </>
      )}

      {running && progress && <Progress value={progress.value} message={progress.message} />}
      {error && <Note type="error" title={T.failed}>{error}</Note>}
      {result && !running && <ImageResult result={result} />}
    </div>
  )
}
