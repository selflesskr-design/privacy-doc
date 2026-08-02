import { useState } from 'react'
import Dropzone from '../../components/Dropzone.jsx'
import FileList from '../../components/FileList.jsx'
import Progress from '../../components/Progress.jsx'
import Note from '../../components/Note.jsx'
import DownloadButton from '../../components/DownloadButton.jsx'
import Icon from '../../components/Icon.jsx'
import { useJob } from '../../hooks/useJob.js'
import { dedupeFiles, skippedNotice } from '../../lib/dedupeFiles.js'
import { imagesToPdf } from './helpers.js'
import { IMAGES_TO_PDF as T } from '../../content/strings.js'

// The margin field is in millimetres; PDF pages are measured in points.
const MM_TO_PT = 72 / 25.4

export default function ImagesToPdf() {
  const [files, setFiles] = useState([])
  const [notice, setNotice] = useState('')
  const [pageSize, setPageSize] = useState('A4')
  const [orientation, setOrientation] = useState('auto')
  const [margin, setMargin] = useState(0)
  const { running, progress, error, result, run, reset } = useJob()

  const addFiles = (incoming) => {
    const images = incoming.filter((f) => f.type.startsWith('image/'))
    const { unique, skipped } = dedupeFiles(files, images)
    if (unique.length) setFiles((prev) => [...prev, ...unique])
    setNotice(skippedNotice(skipped))
    reset()
  }
  const move = (from, to) => {
    reset()
    setFiles((prev) => {
      const next = [...prev]
      const [item] = next.splice(from, 1)
      next.splice(to, 0, item)
      return next
    })
  }
  const remove = (i) => {
    reset()
    setFiles((prev) => prev.filter((_, idx) => idx !== i))
  }
  // Settings changed means the built PDF no longer matches what is on screen.
  const setOption = (set) => (e) => {
    set(e.target.value)
    reset()
  }

  const generate = () =>
    run((onProgress) =>
      imagesToPdf(files, { pageSize, orientation, margin: Number(margin) * MM_TO_PT }, onProgress).then(
        (blob) => ({ blob, filename: 'images.pdf' }),
      ),
    )

  return (
    <div className="space-y-6">
      <Dropzone
        onFiles={addFiles}
        accept="image/*"
        label={T.dropLabel}
        hint={T.dropHint}
        icon="imagePlus"
      />

      {files.length > 0 && (
        <>
          <FileList
            files={files}
            onMove={move}
            onRemove={remove}
            onClear={() => {
              setFiles([])
              setNotice('')
              reset()
            }}
            icon="image"
          />

          <div className="card p-4">
            <h3 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">
              {T.options}
            </h3>
            <div className="grid gap-4 sm:grid-cols-3">
              <label className="space-y-1">
                <span className="field-label">{T.pageSize}</span>
                <select
                  className="field-input"
                  value={pageSize}
                  onChange={setOption(setPageSize)}
                >
                  <option value="fit">{T.fitToImage}</option>
                  <option value="A4">A4 (210×297mm)</option>
                  <option value="A5">A5 (148×210mm)</option>
                  <option value="B5">B5 (176×250mm)</option>
                </select>
              </label>
              <label className="space-y-1">
                <span className="field-label">{T.orientation}</span>
                <select
                  className="field-input"
                  value={orientation}
                  disabled={pageSize === 'fit'}
                  onChange={setOption(setOrientation)}
                >
                  <option value="auto">{T.auto}</option>
                  <option value="portrait">{T.portrait}</option>
                  <option value="landscape">{T.landscape}</option>
                </select>
              </label>
              <label className="space-y-1">
                <span className="field-label">{T.margin}</span>
                <input
                  type="number"
                  min="0"
                  max="50"
                  className="field-input"
                  value={margin}
                  onChange={setOption(setMargin)}
                />
              </label>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {result ? (
              <DownloadButton result={result} />
            ) : (
              <button
                type="button"
                className="btn-primary"
                onClick={generate}
                disabled={running}
              >
                <Icon name="fileText" className="h-4 w-4" />
                {T.create}
              </button>
            )}
          </div>
        </>
      )}

      {notice && <Note type="warning">{notice}</Note>}
      {running && progress && <Progress value={progress.value} message={progress.message} />}
      {error && <Note type="error" title={T.failed}>{error}</Note>}
      {result && !running && (
        <Note type="info">{T.ready}</Note>
      )}
    </div>
  )
}
