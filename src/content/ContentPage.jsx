import Blocks from './Blocks.jsx'

// Shell for every content route: breadcrumb, the single H1, then the blocks.
// Kept intentionally plain — no PDF library is imported anywhere in this tree,
// so landing pages never pull the heavy chunks into the initial load.
export default function ContentPage({ page, onNavigate }) {
  return (
    <article>
      {page.breadcrumb?.length > 0 && (
        <nav aria-label="현재 위치" className="mb-4 text-sm text-slate-500 dark:text-slate-400">
          <ol className="flex flex-wrap items-center gap-1.5">
            {page.breadcrumb.map((crumb) => (
              <li key={crumb.path} className="flex items-center gap-1.5">
                <a
                  href={crumb.path}
                  onClick={(e) => {
                    e.preventDefault()
                    onNavigate(crumb.path)
                  }}
                  className="hover:text-brand-600 dark:hover:text-brand-400"
                >
                  {crumb.name}
                </a>
                <span aria-hidden="true">/</span>
              </li>
            ))}
            <li aria-current="page" className="text-slate-700 dark:text-slate-200">
              {page.h1}
            </li>
          </ol>
        </nav>
      )}

      <h1 className="mb-5 text-2xl font-bold tracking-tight sm:text-3xl">{page.h1}</h1>

      <Blocks sections={page.sections} onNavigate={onNavigate} />
    </article>
  )
}
