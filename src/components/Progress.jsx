import Icon from './Icon.jsx'

// Determinate or indeterminate progress indicator for long-running jobs.
// Pass a value 0..1 for determinate; omit for a spinner + message.
export default function Progress({ value, message = '처리하고 있습니다…' }) {
  const pct = value != null ? Math.round(Math.min(1, Math.max(0, value)) * 100) : null
  return (
    <div
      className="space-y-2"
      role="status"
      aria-live="polite"
      aria-label={pct != null ? `${message} ${pct}%` : message}
    >
      <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
        <Icon name="spinner" className="h-4 w-4" />
        <span>{message}</span>
        {pct != null && <span className="ml-auto tabular-nums">{pct}%</span>}
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
        <div
          className={
            'h-full rounded-full bg-brand-600 transition-all duration-200 ' +
            (pct == null ? 'w-1/3 animate-pulse' : '')
          }
          style={pct != null ? { width: `${pct}%` } : undefined}
        />
      </div>
    </div>
  )
}
