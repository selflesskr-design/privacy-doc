import Icon from './Icon.jsx'
import { cx } from '../lib/format.js'

const OPTIONS = [
  { value: 'light', icon: 'sun', label: '밝게' },
  { value: 'dark', icon: 'moon', label: '어둡게' },
  { value: 'system', icon: 'monitor', label: '기기 설정' },
]

export default function ThemeToggle({ theme, setTheme }) {
  return (
    <div
      className="flex items-center rounded-lg border border-slate-200 p-0.5 dark:border-slate-700"
      role="radiogroup"
      aria-label="화면 테마"
    >
      {OPTIONS.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={theme === o.value}
          title={o.label}
          onClick={() => setTheme(o.value)}
          className={cx(
            'rounded-md p-1.5 transition-colors',
            theme === o.value
              ? 'bg-brand-600 text-white'
              : 'text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800',
          )}
        >
          <Icon name={o.icon} className="h-4 w-4" title={o.label} />
        </button>
      ))}
    </div>
  )
}
