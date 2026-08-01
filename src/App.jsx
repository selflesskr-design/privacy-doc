import { Suspense, useEffect, useState, useCallback } from 'react'
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
import { BRAND, UPSTREAM_NAME, UPSTREAM_AUTHOR, UPSTREAM_URL } from './config/site.js'

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
  return getOperation(id) ? { page: null, opId: id } : { page: getPage('/'), opId: null }
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
      e.preventDefault()
      e.stopPropagation()
      dragCounter = 0
      setIsDragging(false)
      const file = e.dataTransfer?.files?.[0]
      if (!file) return
      emitFileDrop(file)
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

  // Standalone "pop-out" mode: render only the active tool, no sidebar/palette.
  const standalone = new URLSearchParams(window.location.search).get('standalone') === '1'
  if (standalone && activeOp) {
    return (
      <div className="flex h-full flex-col">
        <header className="z-20 flex items-center gap-3 border-b border-slate-200 bg-white/80 px-4 py-2.5 backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white">
            <Icon name={activeOp.icon} className="h-5 w-5" />
          </span>
          <span className="font-semibold tracking-tight">{activeOp.name}</span>
          <span className="ml-1 hidden sm:block"><PrivacyBadge compact /></span>
          <div className="ml-auto">
            <ThemeToggle theme={theme} setTheme={setTheme} />
          </div>
        </header>
        <main className="min-w-0 flex-1 overflow-y-auto">
          <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
            <Suspense fallback={<Progress message="도구를 불러오는 중…" />}>
              {Component && <Component key={activeOp.id} />}
            </Suspense>
          </div>
        </main>
      </div>
    )
  }

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
          <a
            href="/security"
            className="btn-ghost gap-1.5 px-2.5"
            title="파일이 밖으로 나가지 않는다는 것을 직접 확인하는 방법"
            onClick={(e) => {
              e.preventDefault()
              handleSelect('/security')
            }}
          >
            <Icon name="shieldCheck" className="h-4 w-4 text-brand-500" />
            <span className="hidden sm:inline">보안</span>
          </a>
          <a
            href="https://github.com/selflesskr-design/privacy-doc"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-ghost hidden px-2 sm:inline-flex"
            title="오픈소스 (MIT) — 소스 보기 / 직접 호스팅"
            aria-label="GitHub"
          >
            <Icon name="github" className="h-5 w-5" />
          </a>
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
          <div className="w-72">
            <Sidebar activeId={activeId} onSelect={handleSelect} onOpenPalette={() => setPaletteOpen(true)} />
          </div>
        </aside>

        {/* Sidebar (mobile drawer) */}
        {mobileNavOpen && (
          <div className="fixed inset-0 z-30 lg:hidden" role="dialog" aria-modal="true">
            <div className="absolute inset-0 bg-slate-900/40" onClick={() => setMobileNavOpen(false)} />
            <aside className="absolute left-0 top-0 h-full w-72 border-r border-slate-200 bg-slate-50 shadow-xl dark:border-slate-800 dark:bg-slate-900">
              <Sidebar
                activeId={activeId}
                onSelect={handleSelect}
                onOpenPalette={() => {
                  setMobileNavOpen(false)
                  setPaletteOpen(true)
                }}
              />
            </aside>
          </div>
        )}

        {/* Main */}
        <main className="min-w-0 flex-1 overflow-y-auto">
          <div className={`mx-auto px-4 py-6 sm:px-6 sm:py-8 ${contentPage?.path === '/tools' ? 'max-w-6xl' : 'max-w-3xl'}`}>
            {contentPage ? (
              <ContentPage page={contentPage} onNavigate={handleSelect} />
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
                        {activeOp.notes}
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

          <footer className="mx-auto max-w-3xl space-y-2 px-4 pb-10 pt-4 text-xs text-slate-400 sm:px-6">
            <p>
              {BRAND}는 파일을 내 브라우저에서 직접 처리합니다. 고른 파일은 밖으로 나가지 않고, 사용 중에
              외부로 나가는 통신도 없습니다. MIT 라이선스 오픈소스입니다.
            </p>
            {/* MIT 의무 사항: 원저작권 고지 유지. LICENSE / NOTICE 파일도 함께 배포됩니다. */}
            <p>
              이 서비스는 MIT 라이선스로 공개된{' '}
              <a
                href={UPSTREAM_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-slate-500 hover:text-brand-600 dark:text-slate-300 dark:hover:text-brand-300"
              >
                {UPSTREAM_NAME}
              </a>
              를 기반으로 만들어졌습니다. Copyright (c) 2026 {UPSTREAM_AUTHOR}.
            </p>
            <p className="flex items-center gap-3">
              <a
                href="https://github.com/selflesskr-design/privacy-doc"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-medium text-slate-500 hover:text-brand-600 dark:text-slate-300 dark:hover:text-brand-300"
              >
                <Icon name="github" className="h-3.5 w-3.5" />
                GitHub에서 소스 보기
              </a>
            </p>
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
