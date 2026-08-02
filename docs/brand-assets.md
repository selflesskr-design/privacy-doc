# 브랜드 자산 규격 (Brand Assets)

Privacy의 브랜드 자산 목록, 규격, 생성 방법, 교체 절차를 정의합니다.

## 원칙

| 자산군 | 텍스트 포함 | 이유 |
|---|---|---|
| 헤더 로고 | **포함** (`Privacy`) | 서비스명 인지 |
| 파비콘 / PWA 아이콘 | **미포함** — 심볼만 | 16~32px에서 글자가 뭉개짐. 문서 + 가림 + 방패 심볼만 사용 |
| OG 이미지 | **포함** | 공유 카드에서는 서비스명과 한 줄 설명이 필요 |

**금지**: DoxDock·OSCode 브랜드 자산, 외부 절대 URL(CDN·shields.io 등) 참조.
모든 이미지는 자기 오리진에서만 제공합니다.

---

## 1. 원본 (Source of truth)

심볼과 색상의 단일 원본은 `src/config/brand.js`입니다. 아래 PNG는 디자인 확인용으로
생성되는 참고 이미지이며, 앱에서 직접 불러오지 않습니다.

| 파일 | 규격 | 설명 |
|---|---|---|
| `brand/logo-source.png` | 1254 × 1254 | 심볼(문서+가림바+방패) + `Privacy` 텍스트 참고 이미지 |

심볼이나 색상을 바꿀 때는 `src/config/brand.js`를 수정하고 아래 생성 절차를 다시 실행합니다.

---

## 2. 심볼 자산 — 텍스트 없음

`scripts/generate-brand-assets.mjs`가 **코드로 그려서** 생성합니다.
원본 PNG를 리샘플링하지 않으므로 어떤 크기에서도 또렷합니다.

| 파일 | 규격 | 형식 | 용도 |
|---|---|---|---|
| `public/favicon.svg` | 100 × 100 viewBox | SVG | 브라우저 탭. 모든 배율에서 벡터로 선명 |
| `public/pwa-192.png` | 192 × 192 | PNG (불투명) | PWA 홈 화면 아이콘 |
| `public/pwa-512.png` | 512 × 512 | PNG (불투명) | PWA 스플래시 / 스토어 |
| `public/pwa-512-maskable.png` | 512 × 512 | PNG (불투명) | Android maskable. 심볼을 **안전영역 80%** 안에 배치 |
| `public/apple-touch-icon-180.png` | 180 × 180 | PNG (불투명) | iOS 홈 화면 |

> maskable 아이콘은 Android가 원형·스퀘어클 등으로 잘라내므로, 바깥 10%가 잘려도
> 심볼이 온전하도록 별도 파일로 분리합니다. 기존 `vite.config.js`는 `pwa-512.png` 하나를
> `any`와 `maskable` 양쪽에 쓰고 있었는데, Phase 1에서 분리했습니다.

### 심볼 구성

문서(둥근 모서리 + 접힌 귀퉁이) 위에 **가림 바** 1개, 우하단에 **주황 방패 + 자물쇠**.
가림 바는 서비스의 핵심 기능을 나타내는 요소이므로 작은 크기에서도 살아남도록
문서 본문 선보다 두껍고 진하게 그립니다.

---

## 3. OG 이미지 — 텍스트 포함

| 파일 | 규격 | 형식 | 용도 |
|---|---|---|---|
| `public/og.png` | **1200 × 630** | PNG | Open Graph / Twitter Card / 카카오톡 공유 |

- 좌측: 심볼, 우측: `Privacy` + 한글 한 줄 설명
- 안전영역: 카카오톡 등이 가장자리를 자르므로 주요 요소를 중앙 1100 × 550 안에 배치
- `index.html`의 `og:image:width` / `og:image:height`를 **1200 / 630**으로 맞춰야 함

---

## 4. 헤더 로고

헤더는 이미지 파일을 쓰지 않고 **인라인 SVG 심볼 + 텍스트**로 구성합니다.
([src/components/BrandMark.jsx](../src/components/BrandMark.jsx))

- 다크모드에서 배경 없이도 읽히고, 추가 네트워크 요청이 없으며, 확대해도 깨지지 않습니다.
- 텍스트는 `Privacy`이며 본문색을 사용합니다.

---

## 5. 브랜드 팔레트

원본 로고에서 추출한 값입니다. [src/config/brand.js](../src/config/brand.js)가 단일 정의 지점입니다.

| 토큰 | 값 | 용도 |
|---|---|---|
| `cream` | `#F7E7D3` | 아이콘 배경 |
| `paper` | `#FBF3E7` | 문서 면 |
| `ink` | `#4A342A` | 문서 외곽선, 가림 바, 자물쇠, `Privacy` 글자 |
| `muted` | `#E4D2B8` | 문서 본문 선, 아바타 박스 |
| `accent` | `#EE8130` | 방패와 강조선 |

---

## 6. 교체 절차

```bash
# 1. 심볼이나 팔레트가 바뀌었다면 src/config/brand.js 수정
# 2. 심볼 자산 재생성 (favicon.svg + PWA 아이콘 4종)
npm run gen:brand

# 3. OG 이미지와 브랜드 참고 이미지 재생성
npm run gen:og

# 4. 검증
npm run build
node scripts/check-external-references.mjs
```

`npm run gen:icons`(DoxDock 시절 스크립트)는 `gen:brand`로 대체되었습니다.
