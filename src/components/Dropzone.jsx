import { useRef, useState, useCallback, useId } from 'react'
import Icon from './Icon.jsx'
import { cx } from '../lib/format.js'
import { useFileDrop } from '../hooks/useFileDrop.js'
import { COMMON } from '../content/strings.js'

// Reusable drag-and-drop dropzone + file picker. Keyboard accessible (Enter/Space
// opens the picker). Files never leave the browser — they are handed straight to
// the calling operation.

// `accept` only ever constrained the file picker; a drop bypassed it entirely.
// Dragging a page thumbnail inside a tool is enough to produce one, because the
// browser hands the dragged image over as a file, and a PNG arriving at a PDF
// tool surfaced as "Invalid PDF structure".
function matchesAccept(file, accept) {
  const patterns = (accept || '').split(',').map((p) => p.trim().toLowerCase()).filter(Boolean)
  if (!patterns.length) return true
  const type = (file.type || '').toLowerCase()
  const name = (file.name || '').toLowerCase()
  return patterns.some((p) => {
    if (p.startsWith('.')) return name.endsWith(p)
    if (p.endsWith('/*')) return type.startsWith(p.slice(0, -1))
    return type === p
  })
}
export default function Dropzone({
  onFiles,
  accept,
  multiple = true,
  label = '파일을 끌어다 놓거나 눌러서 선택하세요',
  hint,
  className,
}) {
  const inputRef = useRef(null)
  const [dragging, setDragging] = useState(false)
  const [rejected, setRejected] = useState(false)
  const id = useId()

  const handleFiles = useCallback(
    (fileList) => {
      const all = Array.from(fileList || [])
      if (!all.length) return
      const files = all.filter((f) => matchesAccept(f, accept))
      setRejected(files.length === 0)
      if (files.length) onFiles(multiple ? files : [files[0]])
    },
    [onFiles, multiple, accept],
  )

  const onDrop = useCallback(
    (e) => {
      // preventDefault also marks the drop handled, which is how the window
      // listener knows not to deliver these files a second time. The event has
      // to keep bubbling: that listener is what clears the drag overlay.
      e.preventDefault()
      setDragging(false)
      handleFiles(e.dataTransfer.files)
    },
    [handleFiles],
  )

  const open = () => inputRef.current?.click()

  // Route window-wide drops (anywhere outside this box) into the same pipeline.
  useFileDrop(handleFiles)

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={label}
      aria-describedby={hint ? `${id}-hint` : undefined}
      onClick={open}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          open()
        }
      }}
      onDragOver={(e) => {
        e.preventDefault()
        setDragging(true)
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      className={cx(
        'flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-8 text-center transition-colors',
        dragging
          ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20'
          : 'border-slate-300 bg-white hover:border-brand-400 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800',
        className,
      )}
    >
      <span
        className={cx(
          'flex h-12 w-12 items-center justify-center rounded-full',
          dragging
            ? 'bg-brand-100 text-brand-600 dark:bg-brand-800 dark:text-brand-200'
            : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
        )}
      >
        <Icon name="upload" className="h-6 w-6" />
      </span>
      <div>
        <p className="font-medium text-slate-700 dark:text-slate-200">{label}</p>
        {hint && (
          <p id={`${id}-hint`} className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {hint}
          </p>
        )}
        {rejected && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{COMMON.wrongType}</p>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        className="sr-only"
        onChange={(e) => {
          handleFiles(e.target.files)
          e.target.value = '' // allow re-selecting the same file
        }}
      />
    </div>
  )
}
