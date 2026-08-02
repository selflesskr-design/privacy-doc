import { useState } from 'react'
import Dropzone from '../../components/Dropzone.jsx'
import Progress from '../../components/Progress.jsx'
import Note from '../../components/Note.jsx'
import Icon from '../../components/Icon.jsx'
import ResultGallery from '../../components/ResultGallery.jsx'
import { useJob } from '../../hooks/useJob.js'
import { formatBytes } from '../../lib/format.js'
import { watermarkImages, POSITIONS } from './helpers.js'
import { WATERMARK_IMAGE as T } from '../../content/strings.js'

export default function WatermarkImage() {
  const [files, setFiles] = useState([])
  const [mode, setMode] = useState('text')
  const [text, setText] = useState('')
  const [logo, setLogo] = useState(null)
  const [position, setPosition] = useState('bottom-right')
  const [layout, setLayout] = useState('single')
  const [opacity, setOpacity] = useState(0.35)
  const [scale, setScale] = useState(0.25)
  const [color, setColor] = useState('#ffffff')
  const [angle, setAngle] = useState(30)
  const { running, progress, error, result, run, reset } = useJob()

  const pick = (picked) => {
    setFiles(picked)
    reset()
  }
  const setOption = (set) => (e) => {
    set(e.target.value)
    reset()
  }
  const go = () =>
    run((p) =>
      watermarkImages(
        files,
        {
          mode,
          text,
          logo,
          position,
          layout,
          opacity: Number(opacity),
          scale: Number(scale),
          color,
          angle: Number(angle),
        },
        p,
      ),
    )

  return (
    <div className="space-y-6">
      <Dropzone
        onFiles={pick}
        accept="image/*"
        multiple
        label={T.dropLabel}
        hint={T.dropHint}
        icon="image"
      />

      {files.length > 0 && (
        <>
          <div className="card flex items-center gap-3 p-3">
            <Icon name="image" className="h-5 w-5 text-brand-600" />
            <span className="min-w-0 flex-1 truncate text-sm font-medium">
              {files.length === 1 ? files[0].name : T.count(files.length)}
            </span>
            <span className="text-xs text-slate-400">
              {formatBytes(files.reduce((sum, f) => sum + f.size, 0))}
            </span>
          </div>

          <div className="card space-y-4 p-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-1">
                <span className="field-label">{T.mode}</span>
                <select
                  className="field-input"
                  value={mode}
                  onChange={setOption(setMode)}
                >
                  <option value="text">{T.modeText}</option>
                  <option value="logo">{T.modeLogo}</option>
                </select>
              </label>

              {mode === 'text' ? (
                <label className="space-y-1">
                  <span className="field-label">{T.text}</span>
                  <input
                    className="field-input"
                    value={text}
                    onChange={setOption(setText)}
                    placeholder={T.textPlaceholder}
                  />
                </label>
              ) : (
                <label className="space-y-1">
                  <span className="field-label">{T.logo}</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="field-input"
                    onChange={(e) => {
                      setLogo(e.target.files?.[0] || null)
                      reset()
                    }}
                  />
                </label>
              )}

              <label className="space-y-1">
                <span className="field-label">{T.layout}</span>
                <select
                  className="field-input"
                  value={layout}
                  onChange={setOption(setLayout)}
                >
                  <option value="single">{T.single}</option>
                  <option value="tile">{T.tile}</option>
                </select>
              </label>

              {layout === 'single' ? (
                <label className="space-y-1">
                  <span className="field-label">{T.position}</span>
                  <select
                    className="field-input"
                    value={position}
                    onChange={setOption(setPosition)}
                  >
                    {POSITIONS.map((p) => (
                      <option key={p} value={p}>
                        {T.positions[p]}
                      </option>
                    ))}
                  </select>
                </label>
              ) : (
                <label className="space-y-1">
                  <span className="field-label">{T.angle(angle)}</span>
                  <input
                    type="range"
                    min="0"
                    max="90"
                    value={angle}
                    onChange={setOption(setAngle)}
                    className="w-full accent-brand-600"
                  />
                </label>
              )}

              <label className="space-y-1">
                <span className="field-label">{T.opacity(Math.round(opacity * 100))}</span>
                <input
                  type="range"
                  min="0.05"
                  max="1"
                  step="0.05"
                  value={opacity}
                  onChange={setOption(setOpacity)}
                  className="w-full accent-brand-600"
                />
              </label>

              <label className="space-y-1">
                <span className="field-label">{T.size(Math.round(scale * 100))}</span>
                <input
                  type="range"
                  min="0.05"
                  max="1"
                  step="0.05"
                  value={scale}
                  onChange={setOption(setScale)}
                  className="w-full accent-brand-600"
                />
              </label>

              {mode === 'text' && (
                <label className="space-y-1">
                  <span className="field-label">{T.color}</span>
                  <input
                    type="color"
                    value={color}
                    onChange={setOption(setColor)}
                    className="field-input h-10 p-1"
                  />
                </label>
              )}
            </div>
          </div>

          {!result && (
            <button type="button" className="btn-primary" onClick={go} disabled={running || !text.trim()}>
              <Icon name="droplet" className="h-4 w-4" />
              {T.apply(files.length)}
            </button>
          )}
        </>
      )}

      {running && progress && <Progress value={progress.value} message={progress.message} />}
      {error && <Note type="error" title={T.failed}>{error}</Note>}
      {result && !running && (
        <ResultGallery results={result} zipName={T.zipName} />
      )}
    </div>
  )
}
