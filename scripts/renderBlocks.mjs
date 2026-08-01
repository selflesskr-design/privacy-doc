// HTML renderer for the content blocks in src/content/pages.js.
//
// Mirrors src/content/Blocks.jsx. React replaces #root on load (createRoot, not
// hydrate), so this markup is what crawlers and the first paint see — it has to
// carry the real H1, prose and internal links, not an empty container.

export const escText = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
export const escAttr = (s) => escText(s).replace(/"/g, '&quot;')

const a = (href, label) => `<a href="${escAttr(href)}">${escText(label)}</a>`

function toolCategoriesHtml(ops) {
  const groups = [
    { id: 'pdf', label: 'PDF 도구' },
    { id: 'image', label: '이미지 도구' },
    { id: 'other', label: '문서 변환' },
  ]
  return groups
    .map((g) => {
      const items = ops.filter((o) => o.category === g.id)
      if (!items.length) return ''
      const list = items
        .map((o) => `<li>${a(`/${o.id}`, o.name)} — ${escText(o.description)}</li>`)
        .join('')
      return `<section><h2>${escText(g.label)}</h2><ul>${list}</ul></section>`
    })
    .join('')
}

/** @param {object[]} sections @param {{ops: object[]}} ctx */
export function renderBlocks(sections, ctx = {}) {
  return sections
    .map((b) => {
      switch (b.t) {
        case 'p':
          return `<p>${escText(b.text)}</p>`
        case 'h2':
          return `<h2>${escText(b.text)}</h2>`
        case 'ul':
          return `<ul>${b.items.map((i) => `<li>${escText(i)}</li>`).join('')}</ul>`
        case 'steps':
          return `<ol>${b.items
            .map((s) => `<li><strong>${escText(s.title)}</strong> — ${escText(s.text)}</li>`)
            .join('')}</ol>`
        case 'note':
          return `<p role="note"><strong>${escText(b.text)}</strong></p>`
        case 'cta':
          return b.disabled
            ? `<p>${escText(b.label)} (준비 중)</p>`
            : `<p>${a(b.href, b.label)}</p>`
        case 'link':
          return `<p>${a(b.href, b.label)}</p>`
        case 'cards':
          return (
            (b.title ? `<h2>${escText(b.title)}</h2>` : '') +
            `<ul>${b.items
              .map((i) => `<li>${a(i.href, i.label)} — ${escText(i.text)}</li>`)
              .join('')}</ul>`
          )
        case 'faq':
          return `<dl>${b.items
            .map((i) => `<dt>${escText(i.q)}</dt><dd>${escText(i.a)}</dd>`)
            .join('')}</dl>`
        case 'actions':
          return `<p>${b.items.map((i) => a(i.href, i.label)).join(' · ')}</p>`
        case 'redactDemo':
          // The visual is decorative; crawlers get the claim it illustrates.
          return `<p>가리기 전에는 주민등록번호가 그대로 보이지만, 가린 뒤에는 복사해도 글자가 나오지 않습니다.</p>`
        case 'toolCategories':
          return toolCategoriesHtml(ctx.ops || [])
        default:
          return ''
      }
    })
    .join('\n')
}

export function renderPageBody(page, ctx) {
  const crumbs = page.breadcrumb?.length
    ? `<nav aria-label="현재 위치"><ol>${page.breadcrumb
        .map((c) => `<li>${a(c.path, c.name)}</li>`)
        .join('')}<li>${escText(page.h1)}</li></ol></nav>`
    : ''
  return (
    `<main style="max-width:760px;margin:0 auto;padding:2.5rem 1.5rem;` +
    `font-family:system-ui,-apple-system,sans-serif;line-height:1.7">` +
    crumbs +
    `<h1>${escText(page.h1)}</h1>` +
    renderBlocks(page.sections, ctx) +
    `</main>`
  )
}
