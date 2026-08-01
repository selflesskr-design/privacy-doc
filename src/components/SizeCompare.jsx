import { formatBytes, percentChange } from '../lib/format.js'

// Reusable before/after size display for compression-type operations.
export default function SizeCompare({ before, after }) {
  if (before == null || after == null) return null
  const change = percentChange(before, after)
  const smaller = change > 0
  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-lg bg-slate-50 p-4 dark:bg-slate-800/60">
      <div>
        <p className="text-xs tracking-wide text-slate-500 dark:text-slate-400">처리 전</p>
        <p className="text-lg font-semibold tabular-nums">{formatBytes(before)}</p>
      </div>
      <div className="text-slate-400">→</div>
      <div>
        <p className="text-xs tracking-wide text-slate-500 dark:text-slate-400">처리 후</p>
        <p className="text-lg font-semibold tabular-nums">{formatBytes(after)}</p>
      </div>
      <div
        className={
          'ml-auto rounded-full px-3 py-1 text-sm font-semibold ' +
          (smaller
            ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
            : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300')
        }
      >
        {smaller ? `${change}% 줄었습니다` : change === 0 ? '변화 없음' : `${-change}% 늘었습니다`}
      </div>
    </div>
  )
}
