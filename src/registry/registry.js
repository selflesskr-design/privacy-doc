import { lazy } from 'react'

// ─────────────────────────────────────────────────────────────────────────────
// Operation registry — the heart of DoxDock's plugin architecture.
//
// To add a new operation you drop a folder in src/operations/<my-op>/ containing:
//   • meta.js    → export default { id, name, description, category, icon, notes? }
//   • index.jsx  → export default function Component() { ... }
//   • helpers.js → pure functions (optional)
//
// The globs below auto-discover it. Nothing else needs editing — no central
// switch statement, no manual import. Metadata is loaded eagerly (cheap, needed
// for the sidebar/search); the component is code-split and loaded on demand so
// heavy libraries (pdf.js, docx, …) only download when a tool is opened.
// ─────────────────────────────────────────────────────────────────────────────

const metaModules = import.meta.glob('../operations/*/meta.js', { eager: true })
const componentLoaders = import.meta.glob('../operations/*/index.jsx')

function folderOf(path) {
  const m = path.match(/operations\/([^/]+)\//)
  return m ? m[1] : path
}

export const operations = Object.entries(metaModules)
  .map(([path, mod]) => {
    const folder = folderOf(path)
    const loaderKey = Object.keys(componentLoaders).find(
      (k) => folderOf(k) === folder,
    )
    if (!loaderKey) {
      console.warn(`[registry] ${folder} has meta.js but no index.jsx`)
      return null
    }
    const meta = mod.default || mod
    return {
      folder,
      ...meta,
      Component: lazy(componentLoaders[loaderKey]),
    }
  })
  .filter(Boolean)
  .sort((a, b) => (a.order ?? 100) - (b.order ?? 100) || a.name.localeCompare(b.name))

// Category definitions (label + icon + ordering). Any operation whose category
// isn't listed here still shows up under its raw category name.
export const CATEGORY_ORDER = [
  { id: 'pdf', label: 'PDF', icon: 'fileText' },
  { id: 'image', label: '사진', icon: 'image' },
  { id: 'other', label: '변환', icon: 'tools' },
]

export function getOperation(id) {
  return operations.find((op) => op.id === id)
}

/** Operations grouped by category, in the defined category order. */
export function groupedOperations(list = operations) {
  const groups = new Map()
  for (const op of list) {
    if (!groups.has(op.category)) groups.set(op.category, [])
    groups.get(op.category).push(op)
  }
  const known = CATEGORY_ORDER.map((c) => ({
    ...c,
    ops: groups.get(c.id) || [],
  })).filter((c) => c.ops.length)
  // Include any categories not in CATEGORY_ORDER.
  for (const [cat, ops] of groups) {
    if (!CATEGORY_ORDER.some((c) => c.id === cat)) {
      known.push({ id: cat, label: cat, icon: 'folder', ops })
    }
  }
  return known
}

/** Simple fuzzy-ish search over name/description/category. */
export function searchOperations(query) {
  const q = query.trim().toLowerCase()
  if (!q) return operations
  const terms = q.split(/\s+/)
  return operations.filter((op) => {
    const hay = `${op.name} ${op.description} ${op.category}`.toLowerCase()
    return terms.every((t) => hay.includes(t))
  })
}
