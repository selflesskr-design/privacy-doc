import { useState } from 'react'
import Dropzone from '../../components/Dropzone.jsx'
import FileList from '../../components/FileList.jsx'
import Progress from '../../components/Progress.jsx'
import Note from '../../components/Note.jsx'
import Icon from '../../components/Icon.jsx'
import DownloadButton from '../../components/DownloadButton.jsx'
import { useJob } from '../../hooks/useJob.js'
import { dedupeFiles, skippedNotice } from '../../lib/dedupeFiles.js'
import { mergePdfs } from './helpers.js'
import { MERGE_PDFS as T } from '../../content/strings.js'

export default function MergePdfs() {
  const [files, setFiles] = useState([])
  const [notice, setNotice] = useState('')
  const { running, progress, error, result, run, reset } = useJob()

  const add = (incoming) => {
    const pdfs = incoming.filter((f) => /pdf$/i.test(f.type) || /\.pdf$/i.test(f.name))
    const { unique, skipped } = dedupeFiles(files, pdfs)
    if (unique.length) setFiles((prev) => [...prev, ...unique])
    setNotice(skippedNotice(skipped))
    reset()
  }
  // Reordering or removing changes what a merge would produce, so a result
  // built before the change no longer matches the list on screen.
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

  const merge = () => run((p) => mergePdfs(files, p).then((blob) => ({ blob, filename: 'merged.pdf' })))

  return (
    <div className="space-y-6">
      <Dropzone onFiles={add} accept="application/pdf,.pdf" label={T.dropLabel} hint={T.dropHint} icon="fileText" />

      {files.length > 0 && (
        <>
          <FileList files={files} onMove={move} onRemove={remove} onClear={() => { setFiles([]); setNotice(''); reset() }} />
          <div className="flex flex-wrap items-center gap-3">
            {result ? (
              <DownloadButton result={result} />
            ) : (
              <button type="button" className="btn-primary" onClick={merge} disabled={running || files.length < 2}>
                <Icon name="layers" className="h-4 w-4" />
                {T.merge(files.length)}
              </button>
            )}
          </div>
        </>
      )}

      {notice && <Note type="info">{notice}</Note>}
      {running && progress && <Progress value={progress.value} message={progress.message} />}
      {error && <Note type="error" title={T.failed}>{error}</Note>}
    </div>
  )
}
