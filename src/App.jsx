import { Suspense, lazy, useEffect, useState, useCallback, useRef } from 'react'
import Sidebar from './components/Sidebar.jsx'
import CommandPalette from './components/CommandPalette.jsx'
import PrivacyBadge from './components/PrivacyBadge.jsx'
import ThemeToggle from './components/ThemeToggle.jsx'
import Note from './components/Note.jsx'
import Icon from './components/Icon.jsx'
import Progress from './components/Progress.jsx'
import BrandMark from './components/BrandMark.jsx'
import ContentPage from './content/ContentPage.jsx'
import { getPage } from './content/pages.js'
import { useTheme } from './hooks/useTheme.js'
import { useLocalStorage } from './hooks/useLocalStorage.js'
import { useSeo } from './hooks/useSeo.js'
import { getOperation } from './registry/registry.js'
import { emitFileDrop } from './lib/fileDropBus.js'
import { BRAND } from './config/site.js'
import { COMMON } from './content/strings.js'

// Editor routes mount a real tool instead of prose. Code-split so the PDF
// libraries stay out of every other page's bundle.
const EDITORS = {
  'pdf-redact': lazy(() => import('./editors/PdfRedactEditor.jsx')),
  'image-redact': lazy(() => import('./editors/ImageRedactEditor.jsx')),
}

// Path routing. Two kinds of route share one path space:
//   • content pages  ("/", "/tools/pdf-redact", "/guides/…") — see src/content/pages.js
//   • tool pages     ("/merge-pdfs") — one per entry in the operation registry
// Content paths are checked first; the 24 original tool URLs are untouched.
// Legacy hash links ("/#/merge-pdfs") are redirected to the path form on load.
function normalizePath(pathname) {
  let clean
  try {
    clean = decodeURIComponent(pathname).replace(/\/+$/, '')
  } catch {
    // A malformed percent-encoded URL (for example, "/%" or "/%ZZ") must
    // render the normal not-found page instead of crashing before React mounts.
    return '/404'
  }
  return clean === '' ? '/' : clean
}

function resolveRoute(pathname) {
  const path = normalizePath(pathname)
  const page = getPage(path)
  if (page) return { page, opId: null }
  const id = path.replace(/^\//, '')
  if (id === 'home') return { page: getPage('/'), opId: null }
  if (getOperation(id)) return { page: null, opId: id }
  return { page: getPage('/404'), opId: null }
}

function useRouteSelection() {
  const [route, setRoute] = useState(() => resolveRoute(window.location.pathname))

  const navigate = useCallback((to) => {
    // `null` keeps the old "go home" call signature used by the sidebar/palette.
    const target = to == null ? '/' : to.startsWith('/') ? to : `/${to}`
    setRoute(resolveRoute(target))
    if (normalizePath(window.location.pathname) !== normalizePath(target)) {
      window.history.pushState({}, '', target)
    }
    window.scrollTo(0, 0)
  }, [])

  useEffect(() => {
    const legacy = window.location.hash.match(/^#\/?(.*)$/)
    if (legacy) {
      const id = legacy[1] === 'home' ? '' : legacy[1]
      const target = getOperation(id) ? `/${id}` : '/'
      window.history.replaceState({}, '', target + window.location.search)
      setRoute(resolveRoute(target))
    }
    const onPop = () => setRoute(resolveRoute(window.location.pathname))
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  return [route, navigate]
}

export default function App() {
  const [theme, setTheme] = useTheme()
  const [route, navigate] = useRouteSelection()
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [collapsed, setCollapsed] = useLocalStorage('privacydoc:sidebarCollapsed', false)
  const mobileMenuButtonRef = useRef(null)
  const mobileDrawerRef = useRef(null)

  const closeMobileNav = useCallback(() => {
    setMobileNavOpen(false)
    requestAnimationFrame(() => mobileMenuButtonRef.current?.focus())
  }, [])

  const activeId = route.opId
  const contentPage = route.page
  const activeOp = activeId ? getOperation(activeId) : null

  useSeo(activeOp, contentPage)

  // Global Cmd/Ctrl+K to open the palette.
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setPaletteOpen((o) => !o)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    let dragCounter = 0

    const onDragEnter = (e) => {
      e.preventDefault()
      dragCounter++
      if (e.dataTransfer?.types?.includes('Files')) setIsDragging(true)
    }
    const onDragOver = (e) => { e.preventDefault() }
    const onDragLeave = (e) => {
      e.preventDefault()
      dragCounter--
      if (dragCounter <= 0) { dragCounter = 0; setIsDragging(false) }
    }
    const onDrop = (e) => {
      // A dropzone (or a reorder target) that already took this drop called
      // preventDefault on the way up. Clear the overlay either way.
      const handled = e.defaultPrevented
      e.preventDefault()
      dragCounter = 0
      setIsDragging(false)
      if (handled) return
      const files = Array.from(e.dataTransfer?.files || [])
      if (files.length) emitFileDrop(files)
    }

    window.addEventListener('dragenter', onDragEnter)
    window.addEventListener('dragover', onDragOver)
    window.addEventListener('dragleave', onDragLeave)
    window.addEventListener('drop', onDrop)

    return () => {
      window.removeEventListener('dragenter', onDragEnter)
      window.removeEventListener('dragover', onDragOver)
      window.removeEventListener('dragleave', onDragLeave)
      window.removeEventListener('drop', onDrop)
    }
  }, [])

  useEffect(() => {
    if (!mobileNavOpen) return undefined

    const drawer = mobileDrawerRef.current
    const focusableSelector = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
    ].join(',')
    const focusableItems = () => Array.from(drawer?.querySelectorAll(focusableSelector) || [])
    const previousOverflow = document.body.style.overflow

    document.body.style.overflow = 'hidden'
    requestAnimationFrame(() => (focusableItems()[0] || drawer)?.focus())

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        closeMobileNav()
        return
      }
      if (event.key !== 'Tab') return

      const items = focusableItems()
      if (!items.length) {
        event.preventDefault()
        drawer?.focus()
        return
      }

      const first = items[0]
      const last = items[items.length - 1]
      if (event.shiftKey && (document.activeElement === first || !drawer?.contains(document.activeElement))) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
    }
  }, [mobileNavOpen, closeMobileNav])

  const handleSelect = (id) => {
    navigate(id)
    if (mobileNavOpen) closeMobileNav()
  }

  const Component = activeOp?.Component

  return (
    <div className="flex h-full flex-col">
      {isDragging && (
        <div className="pointer-events-none fixed inset-0 z-50 flex flex-col items-center justify-center gap-3 bg-brand-900/40 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-brand-400 bg-white/90 px-12 py-10 shadow-2xl dark:bg-slate-900/90">
            <Icon name="upload" className="h-10 w-10 text-brand-500" />
            <p className="text-lg font-semibold text-brand-700 dark:text-brand-300">파일을 어디에나 놓으세요</p>
          </div>
        </div>
      )}
      {/* Top bar */}
      <header
        className="z-20 flex items-center gap-3 border-b border-slate-200 bg-white/80 px-4 py-3 backdrop-blur dark:border-slate-800 dark:bg-slate-950/80"
        aria-hidden={mobileNavOpen ? 'true' : undefined}
      >
        <button
          ref={mobileMenuButtonRef}
          type="button"
          className="btn-ghost -ml-2 h-11 w-11 p-0 lg:hidden"
          aria-label="메뉴 열기"
          aria-controls="mobile-navigation"
          aria-expanded={mobileNavOpen}
          onClick={() => setMobileNavOpen(true)}
        >
          <Icon name="grid" className="h-5 w-5" />
        </button>
        <button
          type="button"
          className="btn-ghost -ml-2 hidden px-2 lg:inline-flex"
          aria-label={collapsed ? '메뉴 펼치기' : '메뉴 접기'}
          aria-pressed={collapsed}
          title={collapsed ? '메뉴 펼치기' : '메뉴 접기'}
          onClick={() => setCollapsed((c) => !c)}
        >
          <Icon name="panelLeft" className="h-5 w-5" />
        </button>
        <a href="/" className="flex items-center gap-2" onClick={(e) => { e.preventDefault(); handleSelect(null) }}>
          <BrandMark />
        </a>
        <div className="ml-2 hidden md:block">
          <PrivacyBadge />
        </div>
        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle theme={theme} setTheme={setTheme} />
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        {/* Sidebar (desktop) */}
        <aside
          className={`hidden flex-shrink-0 overflow-hidden bg-slate-50 transition-[width,border] duration-200 dark:bg-slate-900/50 lg:block ${
            collapsed ? 'lg:w-0 border-r-0' : 'w-72 border-r border-slate-200 dark:border-slate-800'
          }`}
        >
          {/* h-full matters: without a definite height here, Sidebar's own
              h-full resolves to auto, its nav never becomes scrollable, and the
              aside's overflow-hidden silently clips the tools below the fold. */}
          <div className="h-full w-72">
            <Sidebar activeId={activeId} activePath={contentPage?.path} onSelect={handleSelect} />
          </div>
        </aside>

        {/* Sidebar (mobile drawer) */}
        {mobileNavOpen && (
          <div
            id="mobile-navigation"
            ref={mobileDrawerRef}
            className="fixed inset-0 z-30 lg:hidden"
            role="dialog"
            aria-modal="true"
            aria-labelledby="mobile-navigation-title"
            tabIndex={-1}
          >
            <div className="absolute inset-0 bg-slate-900/40" aria-hidden="true" onClick={closeMobileNav} />
            <aside className="absolute left-0 top-0 h-full w-72 border-r border-slate-200 bg-slate-50 shadow-xl dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between border-b border-slate-200 px-3 py-2 dark:border-slate-800">
                <h2 id="mobile-navigation-title" className="text-sm font-semibold">전체 메뉴</h2>
                <button
                  type="button"
                  className="btn-ghost h-11 w-11 p-0"
                  aria-label="메뉴 닫기"
                  onClick={closeMobileNav}
                >
                  <Icon name="x" className="h-5 w-5" />
                </button>
              </div>
              <Sidebar
                activeId={activeId}
                activePath={contentPage?.path}
                onSelect={handleSelect}
              />
            </aside>
          </div>
        )}

        {/* Main */}
        <main
          className="min-w-0 flex-1 overflow-y-auto"
          aria-hidden={mobileNavOpen ? 'true' : undefined}
        >
          <div className={`mx-auto px-4 py-6 sm:px-6 sm:py-8 ${contentPage?.path === '/tools' ? 'max-w-6xl' : 'max-w-3xl'}`}>
            {contentPage ? (
              <>
                <ContentPage page={contentPage} onNavigate={handleSelect} />
                {EDITORS[contentPage.editor] && (
                  <div className="mt-6">
                    <Suspense fallback={<Progress message={COMMON.preparing} />}>
                      {(() => {
                        const Editor = EDITORS[contentPage.editor]
                        return <Editor />
                      })()}
                    </Suspense>
                  </div>
                )}
              </>
            ) : activeOp ? (
              <>
                <div className="mb-6">
                  <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-900/40 dark:text-brand-300">
                      <Icon name={activeOp.icon} className="h-6 w-6" />
                    </span>
                    <div>
                      <h1 className="text-xl font-bold tracking-tight sm:text-2xl">{activeOp.name}</h1>
                      <p className="text-sm text-slate-500 dark:text-slate-400">{activeOp.description}</p>
                    </div>
                  </div>
                  <div className="mt-3 md:hidden">
                    <PrivacyBadge compact />
                  </div>
                  {activeOp.notes && (
                    <div className="mt-4">
                      <Note type="warning" title="알아두실 점">
                        {Array.isArray(activeOp.notes) ? (
                          <ul className="list-disc space-y-1 pl-4">
                            {activeOp.notes.map((n) => (
                              <li key={n}>{n}</li>
                            ))}
                          </ul>
                        ) : (
                          activeOp.notes
                        )}
                      </Note>
                    </div>
                  )}
                </div>

                <Suspense fallback={<Progress message="도구를 불러오는 중…" />}>
                  {Component && <Component key={activeOp.id} />}
                </Suspense>
              </>
            ) : null}
          </div>

          {/* Everything that is not a tool lives here. 개인정보처리방침 could be
              reached from nowhere at all, which is a poor look on a service
              whose subject is exactly that. MIT is satisfied by the LICENSE and
              NOTICE files shipping with the build; /about is the courtesy copy. */}
          <footer className="mx-auto flex max-w-3xl flex-wrap items-center gap-x-3 gap-y-1 px-4 pb-10 pt-4 text-xs text-slate-400 sm:px-6">
            <span>파일은 내 브라우저에서 직접 처리합니다.</span>
            {[
              ['/faq', '자주 묻는 질문'],
              ['/privacy', '개인정보처리방침'],
              ['/about', '소개·라이선스'],
            ].map(([href, label]) => (
              <a
                key={href}
                href={href}
                onClick={(e) => {
                  e.preventDefault()
                  handleSelect(href)
                }}
                className="font-medium text-slate-500 hover:text-brand-600 dark:text-slate-300 dark:hover:text-brand-300"
              >
                {label}
              </a>
            ))}
            <a
              href="https://github.com/selflesskr-design/privacy-doc"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-medium text-slate-500 hover:text-brand-600 dark:text-slate-300 dark:hover:text-brand-300"
            >
              <Icon name="github" className="h-3.5 w-3.5" />
              소스 보기
            </a>
          </footer>
        </main>
      </div>

      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        onSelect={handleSelect}
      />
    </div>
  )
}
