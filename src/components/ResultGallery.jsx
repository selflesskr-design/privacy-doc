import { useEffect, useMemo, useState } from 'react'
import Icon from './Icon.jsx'
import { downloadBlob } from '../lib/download.js'
import { zipFiles } from '../lib/zip.js'
import { formatBytes } from '../lib/format.js'

// Grid of produced files with per-item download, optional image previews, and a
// "Download all (.zip)" action. Object URLs for previews are revoked on unmount.
export default function ResultGallery({ results, zipName = 'privacydoc-output.zip', preview = true }) {
  const [zipping, setZipping] = useState(false)

  const previews = useMemo(
    () =>
      preview
        ? results.map((r) => (r.blob.type.startsWith('image/') ? URL.createObjectURL(r.blob) : null))
        : results.map(() => null),
    [results, preview],
  )
  useEffect(() => () => previews.forEach((u) => u && URL.revokeObjectURL(u)), [previews])

  if (!results?.length) return null

  const downloadAll = async () => {
    setZipping(true)
    try {
      const zip = await zipFiles(results)
      downloadBlob(zip, zipName, 'application/zip')
    } finally {
      setZipping(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
          {results.length} file{results.length === 1 ? '' : 's'} ready
        </p>
        {results.length > 1 && (
          <button type="button" className="btn-primary" onClick={downloadAll} disabled={zipping}>
            <Icon name={zipping ? 'spinner' : 'download'} className="h-4 w-4" />
            {zipping ? 'Zipping…' : 'Download all (.zip)'}
          </button>
        )}
      </div>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {results.map((r, i) => (
          <li key={i} className="card overflow-hidden">
            <button
              type="button"
              onClick={() => downloadBlob(r.blob, r.filename, r.blob.type)}
              className="block w-full text-left"
              title={`Download ${r.filename}`}
            >
              <div className="flex aspect-[3/4] items-center justify-center bg-slate-100 dark:bg-slate-800">
                {previews[i] ? (
                  <img src={previews[i]} alt={r.filename} className="h-full w-full object-contain" />
                ) : (
                  <Icon name="fileText" className="h-10 w-10 text-slate-400" />
                )}
              </div>
              <div className="flex items-center gap-1.5 p-2">
                <Icon name="download" className="h-3.5 w-3.5 flex-shrink-0 text-brand-600" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-xs font-medium">{r.filename}</span>
                  <span className="block text-[10px] text-slate-400">{formatBytes(r.blob.size)}</span>
                </span>
              </div>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
