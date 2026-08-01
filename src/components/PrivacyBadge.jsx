import Icon from './Icon.jsx'

// Always-visible reassurance — the reason this service exists. Stays green:
// it is a status signal, not branding.
export default function PrivacyBadge({ compact = false }) {
  return (
    <div
      className="inline-flex items-center gap-2 rounded-full border border-green-200 bg-green-50 px-3 py-1 text-sm font-medium text-green-700 dark:border-green-800/60 dark:bg-green-900/20 dark:text-green-300"
      title="파일이 밖으로 나가지 않습니다. 모든 처리가 내 브라우저에서 이루어집니다."
    >
      <Icon name="shieldCheck" className="h-4 w-4" />
      {compact ? <span>내 브라우저에서 처리</span> : <span>파일은 내 브라우저에서 처리됩니다</span>}
    </div>
  )
}
