import Icon from './Icon.jsx'

// 글자 한 줄짜리 링크는 도구 아래에서 눈에 띄지 않았습니다. 도구 화면과 편집기가
// 같은 모양을 쓰도록 여기 한 곳에 둡니다.
export default function LearnMore({ href, onNavigate }) {
  return (
    <a
      href={href}
      onClick={(e) => {
        e.preventDefault()
        onNavigate(href)
      }}
      className="card mt-8 flex items-center gap-3 p-4 transition-colors hover:border-brand-400 hover:bg-brand-50/50 dark:hover:bg-brand-900/20"
    >
      <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-900/40 dark:text-brand-300">
        <Icon name="info" className="h-5 w-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold">이 도구에 대해 더 알아보기</span>
        <span className="block text-xs text-slate-500 dark:text-slate-400">
          쓰는 방법, 알아두실 점, 자주 묻는 질문
        </span>
      </span>
      <Icon name="chevronDown" className="h-4 w-4 flex-shrink-0 -rotate-90 text-slate-400" />
    </a>
  )
}
