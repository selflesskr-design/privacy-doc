import { Suspense, lazy, useEffect, useState, useCallback } from 'react'
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
  const clean = decodeURIComponent(pathname).replace(/\/+$/, '')
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

  const handleSelect = (id) => {
    navigate(id)
    setMobileNavOpen(false)
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
      <header className="z-20 flex items-center gap-3 border-b border-slate-200 bg-white/80 px-4 py-3 backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
        <button
          type="button"
          className="btn-ghost -ml-2 px-2 lg:hidden"
          aria-label="메뉴 열기"
          onClick={() => setMobileNavOpen((o) => !o)}
        >
          <Icon name={mobileNavOpen ? 'x' : 'grid'} className="h-5 w-5" />
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
          <div className="fixed inset-0 z-30 lg:hidden" role="dialog" aria-modal="true">
            <div className="absolute inset-0 bg-slate-900/40" onClick={() => setMobileNavOpen(false)} />
            <aside className="absolute left-0 top-0 h-full w-72 border-r border-slate-200 bg-slate-50 shadow-xl dark:border-slate-800 dark:bg-slate-900">
              <Sidebar
                activeId={activeId}
                activePath={contentPage?.path}
                onSelect={handleSelect}
              />
            </aside>
          </div>
        )}

        {/* Main */}
        <main className="min-w-0 flex-1 overflow-y-auto">
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

          {/* MIT asks that the copyright and permission notice ship with the
              software, not that it be repeated on every screen. LICENSE and
              NOTICE go out with the build, the repository is public, and
              /open-source-licenses carries the attribution in full — so the
              footer only needs to point there. */}
          <footer className="mx-auto flex max-w-3xl flex-wrap items-center gap-x-3 gap-y-1 px-4 pb-10 pt-4 text-xs text-slate-400 sm:px-6">
            <span>파일은 내 브라우저에서 직접 처리합니다.</span>
            <a
              href="/open-source-licenses"
              onClick={(e) => {
                e.preventDefault()
                handleSelect('/open-source-licenses')
              }}
              className="font-medium text-slate-500 hover:text-brand-600 dark:text-slate-300 dark:hover:text-brand-300"
            >
              오픈소스 라이선스
            </a>
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
