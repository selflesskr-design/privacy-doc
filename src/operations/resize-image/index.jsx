import { useState, useEffect } from 'react'
import Dropzone from '../../components/Dropzone.jsx'
import Progress from '../../components/Progress.jsx'
import Note from '../../components/Note.jsx'
import Icon from '../../components/Icon.jsx'
import ImageResult from '../../components/ImageResult.jsx'
import { useJob } from '../../hooks/useJob.js'
import { formatBytes } from '../../lib/format.js'
import { decode, dimsOf } from '../../lib/imageCanvas.js'
import { resizeImage } from './helpers.js'
import { RESIZE_IMAGE as T, COMMON } from '../../content/strings.js'

export default function ResizeImage() {
  const [file, setFile] = useState(null)
  const [srcDims, setSrcDims] = useState(null)
  const [mode, setMode] = useState('dimensions')
  const [width, setWidth] = useState('')
  const [height, setHeight] = useState('')
  const [percent, setPercent] = useState(50)
  const [keepAspect, setKeepAspect] = useState(true)
  const [format, setFormat] = useState('keep')
  const { running, slow, progress, error, result, run, reset, cancel } = useJob()

  const pick = async (files) => {
    const f = files[0]
    setFile(f)
    reset()
    setSrcDims(null)
    try {
      const bmp = await decode(f)
      const d = dimsOf(bmp)
      setSrcDims(d)
      setWidth(String(d.width))
      setHeight(String(d.height))
      bmp.close?.()
    } catch {
      /* ignore, error surfaces on run */
    }
  }

  // keep height in sync with width when aspect locked
  useEffect(() => {
    if (mode === 'dimensions' && keepAspect && srcDims && width) {
      setHeight(String(Math.round((srcDims.height / srcDims.width) * Number(width))))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [width, keepAspect])

  const setOption = (set) => (e) => {
    set(e.target.type === 'checkbox' ? e.target.checked : e.target.value)
    reset()
  }
  const go = () => run((p, signal) => resizeImage(file, { mode, width, height, percent: Number(percent), keepAspect, format }, p, signal))

  return (
    <div className="space-y-6">
      <Dropzone onFiles={pick} accept="image/*" multiple={false} label={T.dropLabel} icon="image" />

      {file && (
        <>
          <div className="card flex items-center gap-3 p-3">
            <Icon name="image" className="h-5 w-5 text-brand-600" />
            <span className="min-w-0 flex-1 truncate text-sm font-medium">{file.name}</span>
            <span className="text-xs text-slate-400">
              {srcDims ? `${srcDims.width}×${srcDims.height} · ` : ''}
              {formatBytes(file.size)}
            </span>
          </div>

          <div className="card space-y-4 p-4">
            <label className="block space-y-1">
              <span className="field-label">{T.mode}</span>
              <select className="field-input" value={mode} onChange={setOption(setMode)}>
                <option value="dimensions">{T.byPixels}</option>
                <option value="percent">{T.byPercent}</option>
              </select>
            </label>

            {mode === 'dimensions' ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-1">
                  <span className="field-label">{T.width}</span>
                  <input type="number" min="1" className="field-input" value={width} onChange={setOption(setWidth)} />
                </label>
                <label className="space-y-1">
                  <span className="field-label">{T.height}</span>
                  <input type="number" min="1" className="field-input" value={height} onChange={setOption(setHeight)} disabled={keepAspect} />
                </label>
              </div>
            ) : (
              <label className="space-y-1">
                <span className="field-label">{T.scale(percent)}</span>
                <input type="range" min="5" max="200" value={percent} onChange={setOption(setPercent)} className="w-full accent-brand-600" />
              </label>
            )}

            <div className="flex flex-wrap items-center gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={keepAspect} onChange={setOption(setKeepAspect)} />
                <span title={T.keepAspectHint}>{T.keepAspect}</span>
              </label>
              <label className="flex items-center gap-2 text-sm">
                <span className="text-slate-500">{T.format}</span>
                <select className="field-input py-1" value={format} onChange={setOption(setFormat)}>
                  <option value="keep">{T.keepFormat}</option>
                  <option value="jpeg">JPEG</option>
                  <option value="png">PNG</option>
                  <option value="webp">WebP</option>
                </select>
              </label>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {!result && (
              <button type="button" className="btn-primary" onClick={go} disabled={running}>
                <Icon name="resize" className="h-4 w-4" />
                {T.resize}
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
