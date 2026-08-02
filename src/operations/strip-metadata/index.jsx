import { useState } from 'react'
import Dropzone from '../../components/Dropzone.jsx'
import Progress from '../../components/Progress.jsx'
import Note from '../../components/Note.jsx'
import Icon from '../../components/Icon.jsx'
import ImageResult from '../../components/ImageResult.jsx'
import { useJob } from '../../hooks/useJob.js'
import { formatBytes } from '../../lib/format.js'
import { stripMetadata } from './helpers.js'
import { STRIP_METADATA as T } from '../../content/strings.js'
import { readExif } from '../../lib/exif.js'

export default function StripMetadata() {
  const [file, setFile] = useState(null)
  const [exif, setExif] = useState(null)
  const { running, progress, error, result, run, reset } = useJob()

  const pick = async (files) => {
    const f = files[0]
    setFile(f)
    setExif(null)
    reset()
    setExif(readExif(await f.arrayBuffer()))
  }

  const findings = exif && [
    exif.gps && [T.gpsLabel, T.gpsValue(exif.gps.lat, exif.gps.lon)],
    exif.taken && [T.takenLabel, exif.taken],
    exif.camera && [T.cameraLabel, exif.camera],
    exif.software && [T.softwareLabel, exif.software],
  ].filter(Boolean)
  const go = () => run((p) => stripMetadata(file, {}, p))

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
          {findings && (findings.length ? (
            <div className="card space-y-3 p-4">
              <span className="field-label">{T.found}</span>
              <dl className="space-y-1.5 text-sm">
                {findings.map(([label, value]) => (
                  <div key={label} className="flex flex-wrap gap-x-3">
                    <dt className="w-24 shrink-0 text-slate-500 dark:text-slate-400">{label}</dt>
                    <dd className="font-medium tabular-nums">{value}</dd>
                  </div>
                ))}
              </dl>
              {exif.gps && <Note type="warning">{T.gpsWarn}</Note>}
            </div>
          ) : (
            <Note type="info">{T.foundNone}</Note>
          ))}

          {!result && findings?.length > 0 && (
            <button type="button" className="btn-primary" onClick={go} disabled={running}>
              <Icon name="lock" className="h-4 w-4" />
              {T.strip}
            </button>
          )}
        </>
      )}

      {running && progress && <Progress value={progress.value} message={progress.message} />}
      {error && <Note type="error" title={T.failed}>{error}</Note>}
      {result && !running && (
        <>
          <Note type="info">
            {T.done} {T.sizeNote}
          </Note>
          <ImageResult result={result} />
        </>
      )}
    </div>
  )
}
