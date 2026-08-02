import { useEffect, useState } from 'react'
import Icon from './Icon.jsx'
import SizeCompare from './SizeCompare.jsx'
import { downloadBlob } from '../lib/download.js'
import { formatBytes } from '../lib/format.js'
import { COMMON } from '../content/strings.js'

// Shows a produced image with a download button, and (when before/after sizes
// are supplied) the reusable size-compare bar.
export default function ImageResult({ result }) {
  const [url, setUrl] = useState(null)
  useEffect(() => {
    if (!result?.blob) return
    const u = URL.createObjectURL(result.blob)
    setUrl(u)
    return () => URL.revokeObjectURL(u)
  }, [result])

  if (!result) return null
  const { blob, filename, before, after, width, height } = result

  return (
    <div className="space-y-4">
      {before != null && after != null && <SizeCompare before={before} after={after} />}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-center bg-slate-100 p-4 dark:bg-slate-800">
          {url && <img src={url} alt={filename} className="max-h-96 max-w-full object-contain" />}
        </div>
        <div className="flex flex-wrap items-center gap-3 p-3">
          <button type="button" className="btn-primary" onClick={() => downloadBlob(blob, filename, blob.type)}>
            <Icon name="download" className="h-4 w-4" />
            {COMMON.download}
          </button>
          <span className="text-xs text-slate-400">
            {filename} · {formatBytes(blob.size)}
            {width && height ? ` · ${width}×${height}` : ''}
          </span>
        </div>
      </div>
    </div>
  )
}
