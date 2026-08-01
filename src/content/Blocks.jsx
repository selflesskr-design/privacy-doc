import Icon from '../components/Icon.jsx'
import { groupedOperations } from '../registry/registry.js'

// React renderer for the content blocks defined in pages.js. The Node
// prerenderer (scripts/renderBlocks.mjs) renders the same block types to HTML,
// so a crawler without JavaScript sees the same headings, prose and links.

const CATEGORY_LABELS = {
  pdf: 'PDF 도구',
  image: '이미지 도구',
  other: '문서 변환',
}

function ToolCategories({ onNavigate }) {
  return (
    <div className="mt-6 space-y-8">
      {groupedOperations().map((group) => (
        <section key={group.id}>
          <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
            <Icon name={group.icon} className="h-5 w-5 text-brand-600 dark:text-brand-400" />
            {CATEGORY_LABELS[group.id] || group.label}
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {group.ops.map((op) => (
              <a
                key={op.id}
                href={`/${op.id}`}
                onClick={(e) => {
                  e.preventDefault()
                  onNavigate(`/${op.id}`)
                }}
                className="card flex gap-3 p-4 transition-colors hover:border-brand-400"
              >
                <span className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-900/40 dark:text-brand-300">
                  <Icon name={op.icon} className="h-5 w-5" />
                </span>
                <span className="min-w-0">
                  <span className="block font-medium">{op.name}</span>
                  <span className="mt-0.5 block text-sm text-slate-500 dark:text-slate-400">
                    {op.description}
                  </span>
                </span>
              </a>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}

export default function Blocks({ sections, onNavigate }) {
  const link = (href, children, className) => (
    <a
      href={href}
      className={className}
      onClick={(e) => {
        e.preventDefault()
        onNavigate(href)
      }}
    >
      {children}
    </a>
  )

  return (
    <div className="space-y-5">
      {sections.map((b, i) => {
        switch (b.t) {
          case 'p':
            return (
              <p key={i} className="leading-relaxed text-slate-600 dark:text-slate-300">
                {b.text}
              </p>
            )

          case 'h2':
            return (
              <h2 key={i} className="pt-4 text-xl font-bold tracking-tight">
                {b.text}
              </h2>
            )

          case 'ul':
            return (
              <ul key={i} className="space-y-2">
                {b.items.map((item, j) => (
                  <li key={j} className="flex gap-2.5 text-slate-600 dark:text-slate-300">
                    <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-brand-500" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            )

          case 'steps':
            return (
              <ol key={i} className="space-y-4">
                {b.items.map((step, j) => (
                  <li key={j} className="flex gap-3.5">
                    <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-brand-600 text-sm font-semibold text-white">
                      {j + 1}
                    </span>
                    <span className="min-w-0 pt-0.5">
                      <span className="block font-medium">{step.title}</span>
                      <span className="mt-0.5 block text-sm text-slate-500 dark:text-slate-400">
                        {step.text}
                      </span>
                    </span>
                  </li>
                ))}
              </ol>
            )

          case 'note':
            return (
              <div
                key={i}
                className={
                  'rounded-xl border p-4 text-sm ' +
                  (b.tone === 'warn'
                    ? 'border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-700/60 dark:bg-amber-900/20 dark:text-amber-200'
                    : 'border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-300')
                }
              >
                {b.text}
              </div>
            )

          case 'cta':
            return b.disabled ? (
              <button
                key={i}
                type="button"
                disabled
                className="btn-primary cursor-not-allowed opacity-50"
                title="준비 중입니다"
              >
                {b.label} (준비 중)
              </button>
            ) : (
              <div key={i}>
                {link(
                  b.href,
                  <>
                    {b.label}
                    <Icon name="arrowDown" className="h-4 w-4 -rotate-90" />
                  </>,
                  'btn-primary inline-flex',
                )}
              </div>
            )

          case 'link':
            return (
              <p key={i}>
                {link(
                  b.href,
                  b.label,
                  'font-medium text-brand-600 hover:underline dark:text-brand-400',
                )}
              </p>
            )

          case 'cards':
            return (
              <section key={i} className="pt-2">
                {b.title && <h2 className="mb-3 text-xl font-bold tracking-tight">{b.title}</h2>}
                <div className="grid gap-3 sm:grid-cols-2">
                  {b.items.map((item, j) => (
                    <a
                      key={j}
                      href={item.href}
                      onClick={(e) => {
                        e.preventDefault()
                        onNavigate(item.href)
                      }}
                      className="card p-4 transition-colors hover:border-brand-400"
                    >
                      <span className="block font-medium">{item.label}</span>
                      <span className="mt-1 block text-sm text-slate-500 dark:text-slate-400">
                        {item.text}
                      </span>
                    </a>
                  ))}
                </div>
              </section>
            )

          case 'faq':
            return (
              <dl key={i} className="space-y-4">
                {b.items.map((item, j) => (
                  <div key={j} className="card p-4">
                    <dt className="font-medium">{item.q}</dt>
                    <dd className="mt-1.5 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                      {item.a}
                    </dd>
                  </div>
                ))}
              </dl>
            )

          case 'toolCategories':
            return <ToolCategories key={i} onNavigate={onNavigate} />

          default:
            return null
        }
      })}
    </div>
  )
}
