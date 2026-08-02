import { useState, useEffect } from 'react'
import Dropzone from '../../components/Dropzone.jsx'
import Progress from '../../components/Progress.jsx'
import Note from '../../components/Note.jsx'
import Icon from '../../components/Icon.jsx'
import DownloadButton from '../../components/DownloadButton.jsx'
import { useJob } from '../../hooks/useJob.js'
import { baseName } from '../../lib/format.js'
import { renderThumbnails, buildFromOrder } from './helpers.js'
import { ORGANIZE_PDF as T } from '../../content/strings.js'

export default function OrganizePdf() {
  const [file, setFile] = useState(null)
  const [thumbs, setThumbs] = useState([]) // full set, keyed by original index
  const [items, setItems] = useState([]) // current arrangement: array of original indices
  const [dragIndex, setDragIndex] = useState(null)
  const thumbJob = useJob()
  const buildJob = useJob()

  useEffect(() => () => thumbs.forEach((t) => URL.revokeObjectURL(t.url)), [thumbs])

  const pick = async (files) => {
    const f = files[0]
    setFile(f)
    setThumbs([])
    setItems([])
    buildJob.reset()
    const result = await thumbJob.run((p) => renderThumbnails(f, p))
    if (result) {
      setThumbs(result)
      setItems(result.map((t) => t.index))
    }
  }

  const thumbFor = (idx) => thumbs.find((t) => t.index === idx)

  // Rearranging is the whole tool, so anything built before a rearrangement
  // describes an arrangement that is no longer on screen.
  const move = (from, to) => {
    buildJob.reset()
    setItems((prev) => {
      const next = [...prev]
      const [it] = next.splice(from, 1)
      next.splice(to, 0, it)
      return next
    })
  }
  const remove = (pos) => {
    buildJob.reset()
    setItems((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== pos) : prev))
  }
  const restore = () => {
    buildJob.reset()
    setItems(thumbs.map((t) => t.index))
  }

  const build = () =>
    buildJob.run((p) => buildFromOrder(file, items, p).then((blob) => ({ blob, filename: `${baseName(file.name)}-organized.pdf` })))

  return (
    <div className="space-y-6">
      <Dropzone onFiles={pick} accept="application/pdf,.pdf" multiple={false} label={T.dropLabel} icon="fileText" />

      {thumbJob.running && thumbJob.progress && <Progress value={thumbJob.progress.value} message={thumbJob.progress.message} />}
      {thumbJob.error && <Note type="error" title={T.openFailed}>{thumbJob.error}</Note>}

      {items.length > 0 && (
        <>
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-600 dark:text-slate-300">
              {T.kept(items.length, thumbs.length)} — {T.hint}
            </p>
            <button type="button" className="btn-ghost px-2 py-1 text-xs" onClick={restore}>
              {T.restore}
            </button>
          </div>

          <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
            {items.map((origIdx, pos) => {
              const t = thumbFor(origIdx)
              return (
                <li
                  key={origIdx}
                  draggable
                  onDragStart={() => setDragIndex(pos)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault()
                    if (dragIndex != null && dragIndex !== pos) move(dragIndex, pos)
                    setDragIndex(null)
                  }}
                  className="group relative cursor-grab overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800"
                >
                  <img src={t?.url} alt={T.pageNo(origIdx + 1)} draggable={false} className="w-full" />
                  <span className="absolute left-1 top-1 rounded bg-slate-900/70 px-1.5 py-0.5 text-[10px] font-medium text-white">
                    {origIdx + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => remove(pos)}
                    aria-label={T.removePage(origIdx + 1)}
                    title={items.length > 1 ? T.removePage(origIdx + 1) : T.lastPage}
                    disabled={items.length <= 1}
                    className="absolute right-1 top-1 rounded-full bg-red-600 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100"
                  >
                    <Icon name="x" className="h-3 w-3" />
                  </button>
                </li>
              )
            })}
          </ul>

          <div className="flex flex-wrap items-center gap-3">
            {buildJob.result ? (
              <DownloadButton result={buildJob.result} />
            ) : (
              <button type="button" className="btn-primary" onClick={build} disabled={buildJob.running}>
                <Icon name="check" className="h-4 w-4" />
                {T.apply}
              </button>
            )}
          </div>
          {buildJob.running && buildJob.progress && <Progress value={buildJob.progress.value} message={buildJob.progress.message} />}
          {buildJob.error && <Note type="error" title={T.failed}>{buildJob.error}</Note>}
        </>
      )}
    </div>
  )
}
