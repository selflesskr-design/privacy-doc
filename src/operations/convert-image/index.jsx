import { useState } from 'react'
import Dropzone from '../../components/Dropzone.jsx'
import Progress from '../../components/Progress.jsx'
import Note from '../../components/Note.jsx'
import Icon from '../../components/Icon.jsx'
import ImageResult from '../../components/ImageResult.jsx'
import { useJob } from '../../hooks/useJob.js'
import { formatBytes } from '../../lib/format.js'
import { convertImage } from './helpers.js'
import { CONVERT_IMAGE as T } from '../../content/strings.js'
import { formatFromType } from '../../lib/imageFormat.js'

export default function ConvertImage() {
  const [file, setFile] = useState(null)
  const [format, setFormat] = useState('png')
  const [quality, setQuality] = useState(0.9)
  const { running, progress, error, result, run, reset } = useJob()

  const pick = (files) => {
    const f = files[0]
    setFile(f)
    // Offering the format the file is already in would re-encode it for nothing.
    const src = formatFromType(f.type)
    if (format === src) setFormat(src === 'png' ? 'jpeg' : 'png')
    reset()
  }
  const srcFormat = file ? formatFromType(file.type) : null
  const setOption = (set) => (e) => {
    set(e.target.value)
    reset()
  }
  const go = () => run((p) => convertImage(file, { format, quality: Number(quality) }, p))

  return (
    <div className="space-y-6">
      <Dropzone onFiles={pick} accept="image/*" multiple={false} label={T.dropLabel} icon="image" />

      {file && (
        <>
          <div className="card flex items-center gap-3 p-3">
            <Icon name="image" className="h-5 w-5 text-brand-600" />
            <span className="min-w-0 flex-1 truncate text-sm font-medium">{file.name}</span>
            <span className="text-xs text-slate-400">{formatBytes(file.size)}</span>
          </div>

          <div className="card p-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-1">
                <span className="field-label">{T.target}</span>
                <select className="field-input" value={format} onChange={setOption(setFormat)}>
                  {['png', 'jpeg', 'webp'].map((f) => (
                    <option key={f} value={f} disabled={f === srcFormat}>
                      {T[f]}
                      {f === srcFormat ? ` — ${T.sameAsSource}` : ''}
                    </option>
                  ))}
                </select>
              </label>
              {format !== 'png' && (
                <label className="space-y-1">
                  <span className="field-label">{T.quality(Math.round(quality * 100))}</span>
                  <input type="range" min="0.1" max="1" step="0.05" value={quality} onChange={setOption(setQuality)} className="w-full accent-brand-600" />
                </label>
              )}
            </div>
          </div>

          {!result && (
            <button type="button" className="btn-primary" onClick={go} disabled={running}>
              <Icon name="convert" className="h-4 w-4" />
              {T.convert}
            </button>
          )}
        </>
      )}

      {running && progress && <Progress value={progress.value} message={progress.message} />}
      {error && <Note type="error" title={T.failed}>{error}</Note>}
      {result && !running && <ImageResult result={result} />}
    </div>
  )
}
