import { useState } from 'react'
import Icon from './Icon.jsx'
import { cx } from '../lib/format.js'
import { groupedOperations, searchOperations } from '../registry/registry.js'

export default function Sidebar({ activeId, activePath, onSelect }) {
  const [query, setQuery] = useState('')
  const results = searchOperations(query)
  const groups = groupedOperations(query ? results : results.filter((op) => op.id !== 'strip-metadata'))
  // What protects the person, in one place: cover what shows on a PDF, cover
  // what shows on a photo, and remove what does not show at all. The redactors
  // are routes rather than registry operations, so this list is written by hand
  // and the metadata tool is pulled out of the photo group below to join them.
  const PRIVACY = [
    { path: '/editor/pdf-redact', label: 'PDF 개인정보 가리기', match: ['/editor/pdf-redact', '/tools/pdf-redact'] },
    { path: '/editor/image-redact', label: '사진 개인정보 가리기', match: ['/editor/image-redact', '/tools/image-redact'] },
    { path: '/strip-metadata', label: '사진 위치정보 확인·삭제', match: ['/strip-metadata'] },
  ]
  const isPrivacyActive = (item) => item.match.some((m) => activePath?.startsWith(m))

  return (
    <div className="flex h-full flex-col">
      <div className="p-3">
        <label className="sr-only" htmlFor="sidebar-filter">
          도구 검색
        </label>
        <input
          id="sidebar-filter"
          type="search"
          placeholder="도구 이름으로 찾기"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="field-input mt-2"
        />
      </div>

      <nav className="flex-1 overflow-y-auto px-2 pb-4" aria-label="도구 목록">
        {!query && (
          <button
            type="button"
            onClick={() => onSelect(null)}
            aria-current={activeId == null ? 'page' : undefined}
            className={cx(
              'mb-2 flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition-colors',
              activeId == null
                ? 'bg-brand-50 font-medium text-brand-700 dark:bg-brand-900/30 dark:text-brand-200'
                : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800',
            )}
          >
            <Icon name="home" className={cx('h-4 w-4 flex-shrink-0', activeId == null ? 'text-brand-600 dark:text-brand-300' : 'text-slate-400')} />
            <span>홈</span>
          </button>
        )}

        {!query && (
          <div className="mb-2">
            <p className="px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500">
              개인정보 보호
            </p>
            <ul className="space-y-0.5">
              {PRIVACY.map((item) => {
                const active = isPrivacyActive(item)
                return (
                  <li key={item.path}>
                    <button
                      type="button"
                      onClick={() => onSelect(item.path)}
                      aria-current={active ? 'page' : undefined}
                      className={cx(
                        'flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition-colors',
                        active
                          ? 'bg-brand-50 font-medium text-brand-700 dark:bg-brand-900/30 dark:text-brand-200'
                          : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800',
                      )}
                    >
                      <Icon
                        name="shieldCheck"
                        className={cx(
                          'h-4 w-4 flex-shrink-0',
                          active ? 'text-brand-600 dark:text-brand-300' : 'text-brand-500',
                        )}
                      />
                      <span className="truncate">{item.label}</span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
        )}
        {groups.length === 0 && (
          <p className="px-3 py-4 text-sm text-slate-500">“{query}”에 해당하는 도구가 없습니다.</p>
        )}
        {groups.map((group, gi) => (
          <div
            key={group.id}
            className={cx(
              'mb-2',
              gi > 0 && 'mt-4 border-t border-slate-200/80 pt-4 dark:border-slate-800',
            )}
          >
            <p className="px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500">
              {group.label}
            </p>
            <ul className="space-y-0.5">
              {group.ops.map((op) => (
                <li key={op.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(op.id)}
                    aria-current={activeId === op.id ? 'page' : undefined}
                    className={cx(
                      'flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition-colors',
                      activeId === op.id
                        ? 'bg-brand-50 font-medium text-brand-700 dark:bg-brand-900/30 dark:text-brand-200'
                        : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800',
                    )}
                  >
                    <Icon
                      name={op.icon}
                      className={cx(
                        'h-4 w-4 flex-shrink-0',
                        activeId === op.id ? 'text-brand-600 dark:text-brand-300' : 'text-slate-400',
                      )}
                    />
                    <span className="truncate">{op.name}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
    </div>
  )
}
