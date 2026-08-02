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

/**
 * Before/after, drawn inline as SVG. The product is easier to show than to
 * describe, and an inline drawing costs no extra request and stays sharp.
 */
function RedactDemo() {
  const line = (y, w, fill) => (
    <rect x="14" y={y} width={w} height="5" rx="2.5" fill={fill} />
  )
  const doc = (covered) => (
    <svg viewBox="0 0 130 92" className="w-full" role="img"
      aria-label={covered ? '가린 뒤: 주민등록번호가 검게 덮여 있음' : '가리기 전: 주민등록번호가 그대로 보임'}>
      <rect width="130" height="92" rx="6" fill="#FBF7F2" stroke="#E7DACA" />
      {line(14, 60, '#D5C3AC')}
      {line(26, 90, '#E7DACA')}
      {/* Only the second half is covered — that is what a submission office
          usually asks for, and leaving the front visible makes it obvious what
          was covered and what was not. */}
      <text x="14" y="46" fontSize="9" fontFamily="monospace" fill="#2B221A">990909-</text>
      {covered ? (
        <rect x="52" y="38" width="50" height="10" rx="2" fill="#2B221A" />
      ) : (
        <text x="52" y="46" fontSize="9" fontFamily="monospace" fill="#B85512">1234567</text>
      )}
      {line(58, 86, '#E7DACA')}
      {line(70, 66, '#E7DACA')}
    </svg>
  )
  const caption = 'block text-center text-xs font-medium'
  return (
    <div className="card p-4">
      <div className="flex items-center gap-3 sm:gap-4">
        <div className="min-w-0 flex-1">
          {doc(false)}
          <span className={`${caption} mt-2 text-slate-500 dark:text-slate-400`}>가리기 전</span>
        </div>
        <span aria-hidden="true" className="text-xl text-slate-300 dark:text-slate-600">→</span>
        <div className="min-w-0 flex-1">
          {doc(true)}
          <span className={`${caption} mt-2 text-brand-700 dark:text-brand-300`}>가린 뒤</span>
        </div>
      </div>
      <p className="mt-3 text-center text-xs text-slate-500 dark:text-slate-400">
        가린 부분은 복사해도 글자가 나오지 않습니다
      </p>
    </div>
  )
}

export default function Blocks({ sections, onNavigate }) {
  // Internal paths are handed to the router; anything with a host of its own
  // has to leave the app, or the router swallows it and lands on /404.
  const link = (href, children, className, key) => {
    const external = /^https?:\/\//.test(href)
    return (
      <a
        key={key}
        href={href}
        className={className}
        {...(external
          ? { target: '_blank', rel: 'noopener noreferrer' }
          : {
              onClick: (e) => {
                e.preventDefault()
                onNavigate(href)
              },
            })}
      >
        {children}
      </a>
    )
  }

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
                title="아직 준비 중인 기능입니다"
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

          case 'actions':
            return (
              <div key={i} className="flex flex-wrap gap-3 pt-1">
                {b.items.map((item, j) =>
                  link(
                    item.href,
                    <>
                      {item.label}
                      <Icon name="arrowDown" className="h-4 w-4 -rotate-90" />
                    </>,
                    item.primary
                      ? 'btn-primary inline-flex px-5 py-2.5 text-base'
                      : 'btn-secondary inline-flex px-5 py-2.5 text-base',
                    j,
                  ),
                )}
              </div>
            )

          case 'redactDemo':
            return <RedactDemo key={i} />

          case 'toolCategories':
            return <ToolCategories key={i} onNavigate={onNavigate} />

          default:
            return null
        }
      })}
    </div>
  )
}
