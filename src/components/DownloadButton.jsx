import Icon from './Icon.jsx'
import { downloadBlob } from '../lib/download.js'
import { formatBytes } from '../lib/format.js'

// Renders a download button for one produced result {blob, filename}. Optionally
// shows the output size.
export default function DownloadButton({ result, label, className = '' }) {
  if (!result) return null
  const { blob, filename } = result
  return (
    <button
      type="button"
      onClick={() => downloadBlob(blob, filename, blob.type)}
      className={'btn-primary ' + className}
    >
      <Icon name="download" className="h-4 w-4" />
      {label || `${filename} 받기`}
      {blob?.size != null && (
        <span className="opacity-80">({formatBytes(blob.size)})</span>
      )}
    </button>
  )
}

// Renders download buttons for many results.
export function DownloadAll({ results }) {
  if (!results?.length) return null
  return (
    <div className="flex flex-wrap gap-2">
      {results.map((r, i) => (
        <DownloadButton key={i} result={r} label={r.filename} className="btn-secondary" />
      ))}
    </div>
  )
}
