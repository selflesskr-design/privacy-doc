import { useState } from 'react'
import Dropzone from '../../components/Dropzone.jsx'
import Progress from '../../components/Progress.jsx'
import Note from '../../components/Note.jsx'
import Icon from '../../components/Icon.jsx'
import DownloadButton from '../../components/DownloadButton.jsx'
import { useJob } from '../../hooks/useJob.js'
import { formatBytes, baseName } from '../../lib/format.js'
import { wordToPdf } from './helpers.js'

export default function WordToPdf() {
  const [file, setFile] = useState(null)
  const [pageSize, setPageSize] = useState('A4')
  const [fontSize, setFontSize] = useState(11)
  const { running, progress, error, result, run, reset } = useJob()

  const pick = (files) => {
    setFile(files[0])
    reset()
  }
  const go = () =>
    run((p) => wordToPdf(file, { pageSize, fontSize: Number(fontSize) }, p).then((blob) => ({ blob, filename: `${baseName(file.name)}.pdf` })))

  return (
    <div className="space-y-6">
      <Dropzone onFiles={pick} accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document" multiple={false} label="Drop a .docx file here or click to browse" icon="fileIn" />

      {file && (
        <>
          <div className="card flex items-center gap-3 p-3">
            <Icon name="fileIn" className="h-5 w-5 text-brand-600" />
            <span className="min-w-0 flex-1 truncate text-sm font-medium">{file.name}</span>
            <span className="text-xs text-slate-400">{formatBytes(file.size)}</span>
          </div>

          <div className="card p-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-1">
                <span className="field-label">Page size</span>
                <select className="field-input" value={pageSize} onChange={(e) => setPageSize(e.target.value)}>
                  <option value="A4">A4 (210×297mm)</option>
                  <option value="A5">A5 (148×210mm)</option>
                  <option value="B5">B5 (176×250mm)</option>
                </select>
              </label>
              <label className="space-y-1">
                <span className="field-label">Base font size: {fontSize}pt</span>
                <input type="range" min="9" max="14" value={fontSize} onChange={(e) => setFontSize(e.target.value)} className="w-full accent-brand-600" />
              </label>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button type="button" className="btn-primary" onClick={go} disabled={running}>
              <Icon name="fileIn" className="h-4 w-4" />
              Convert to PDF
            </button>
            {result && <DownloadButton result={result} />}
          </div>
        </>
      )}

      {running && progress && <Progress value={progress.value} message={progress.message} />}
      {error && <Note type="error" title="Conversion failed">{error}</Note>}
    </div>
  )
}
