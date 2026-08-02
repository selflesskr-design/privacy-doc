import { useState, useEffect } from 'react'
import Dropzone from '../../components/Dropzone.jsx'
import Progress from '../../components/Progress.jsx'
import Note from '../../components/Note.jsx'
import Icon from '../../components/Icon.jsx'
import ImageResult from '../../components/ImageResult.jsx'
import { useJob } from '../../hooks/useJob.js'
import { formatBytes } from '../../lib/format.js'
import { rotateFlipImage } from './helpers.js'
import { ROTATE_FLIP as T } from '../../content/strings.js'

export default function RotateFlipImage() {
  const [file, setFile] = useState(null)
  const [rotate, setRotate] = useState(0)
  const [flipH, setFlipH] = useState(false)
  const [flipV, setFlipV] = useState(false)
  const [url, setUrl] = useState(null)
  const { running, progress, error, result, run, reset } = useJob()

  useEffect(() => () => url && URL.revokeObjectURL(url), [url])

  const pick = (files) => {
    setFile(files[0])
    setRotate(0)
    setFlipH(false)
    setFlipV(false)
    reset()
    setUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev)
      return URL.createObjectURL(files[0])
    })
  }
  // The browser applies the EXIF orientation to an <img> just as the export
  // path does, so what the preview turns is what the file will turn.
  const previewTransform = `rotate(${rotate}deg) scaleX(${flipH ? -1 : 1}) scaleY(${flipV ? -1 : 1})`
  const go = () => run((p) => rotateFlipImage(file, { rotate: Number(rotate), flipH, flipV }, p))

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

          <div className="card space-y-4 p-4">
            <label className="block space-y-1">
              <span className="field-label">{T.rotate}</span>
              <div className="flex flex-wrap gap-2">
                {[0, 90, 180, 270].map((deg) => (
                  <button
                    key={deg}
                    type="button"
                    onClick={() => { setRotate(deg); reset() }}
                    className={Number(rotate) === deg ? 'btn-primary' : 'btn-secondary'}
                  >
                    {deg === 0 ? T.none : `${deg}°`}
                  </button>
                ))}
              </div>
            </label>
            <div className="flex flex-wrap items-center gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={flipH} onChange={(e) => { setFlipH(e.target.checked); reset() }} />
                {T.flipH}
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={flipV} onChange={(e) => { setFlipV(e.target.checked); reset() }} />
                {T.flipV}
              </label>
            </div>
          </div>

          <div className="card space-y-2 p-4">
            <span className="field-label">{T.preview}</span>
            <div className="flex h-64 items-center justify-center overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-800">
              {url && (
                <img
                  src={url}
                  alt=""
                  className="max-h-full max-w-full shadow-sm transition-transform duration-200"
                  style={{ transform: previewTransform }}
                />
              )}
            </div>
            <span className="text-xs text-slate-500">{T.previewNote}</span>
          </div>

          {!result && (
            <button type="button" className="btn-primary" onClick={go} disabled={running}>
              <Icon name="flip" className="h-4 w-4" />
              {T.apply}
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
