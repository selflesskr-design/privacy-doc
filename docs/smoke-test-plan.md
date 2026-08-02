# 기존 24개 도구 검증 계획 (Phase 0 산출물)

이 문서는 Privacy 개발 과정에서 **기존 도구의 동작이 깨지지 않았음을 확인**하기 위한
기준선(baseline) 정의와 스모크 테스트 절차입니다.

원칙: **기존 기능의 결과를 변경하는 작업은 이 문서의 해당 항목이 통과된 뒤에만 진행합니다.**

---

## 1. 사전 분류 (정적 분석 기준)

아래 분류는 Phase 0에서 **소스 코드 정적 분석과 라이브러리 동작 실측**으로 도출한 것입니다.
브라우저 실행 테스트로 확정해야 하며, 확정 결과는 4장 기록표에 채웁니다.

### 분류 근거가 된 실측 결과

| 검증 항목 | 방법 | 결과 |
|---|---|---|
| pdf-lib 표준 폰트의 한글 출력 | `drawText('개인정보', StandardFonts.Helvetica)` 직접 실행 | ❌ `WinAnsi cannot encode "개" (0xac1c)` 예외 발생 |
| fflate ZIP의 한글 파일명 | `zipSync({'주민등록등본-p001.png': ...})` 후 헤더 플래그 검사 | ✅ UTF-8 비트(0x800) 설정됨, 왕복 복원 정상 |
| 외부 네트워크 참조 | `node scripts/check-external-references.mjs` | ✅ 위반 0건 |
| 프로덕션 빌드 | `npm run build` | ✅ 24개 도구 페이지 + 사이트맵 생성 |

### 분류 결과

#### 🟢 정상 (10개)
한글·모바일 환경에서 문제가 예상되지 않는 도구. 회귀 테스트만 수행합니다.

| 도구 | 근거 |
|---|---|
| `merge-pdfs` | pdf-lib 페이지 복사만 수행, 폰트·텍스트 미사용 |
| `split-pdf` | 동일. 출력 파일명은 원본명 기반이나 ZIP UTF-8 검증 완료 |
| `rotate-pdf` | 페이지 회전 속성만 변경 |
| `images-to-pdf` | 이미지 임베드만 수행, 텍스트 미사용 |
| `page-numbers-pdf` | 라벨이 숫자 / `Page n` / `n of m` 영문 고정이라 한글 인코딩 경로에 닿지 않음 |
| `compress-image` | Canvas + 워커 기반 |
| `resize-image` | Canvas 기반 |
| `convert-image` | Canvas 기반 |
| `rotate-flip-image` | Canvas 기반 |
| `strip-metadata` | Canvas 재인코딩. **개인정보 도메인 핵심 자산** |

#### 🟡 제한적으로 정상 (4개)
동작하지만 문서에 명시된 본질적 한계가 있는 도구.

| 도구 | 한계 |
|---|---|
| `extract-text` | 텍스트 레이어가 있는 PDF만. **OCR 없음** — 스캔본은 빈 결과 |
| `pdf-to-word` | 텍스트만 추출. 표·이미지·다단 레이아웃 미보존 |
| `compress-pdf` | 문서 종류에 따라 절감률 편차가 큼. 재인코딩 모드는 텍스트 선택 불가로 전환 |
| `watermark-image` | Canvas `fillText` 사용 → **한글 워터마크 정상**. PDF 버전과 달리 제약 없음 |

#### 🔴 한글 환경에서 문제 있음 (5개)
`pdf-lib`의 표준 폰트(WinAnsi)로 텍스트를 그리는 경로. **한글 입력 시 예외 발생.**

| 도구 | 증상 | 영향 범위 |
|---|---|---|
| `edit-pdf` | 텍스트 도구로 한글 입력 후 내보내기 → 예외 | 텍스트 도구만. 사각형·화이트아웃·형광펜·그리기·이미지는 정상 |
| `watermark-pdf` | 한글 워터마크 문구 입력 시 예외 | 기능 전체 |
| `markdown-to-pdf` | 한글 마크다운 → 예외 | 기능 전체 |
| `html-to-pdf` | 한글 HTML → 예외 | 기능 전체 |
| `word-to-pdf` | 한글 `.docx` → 예외 (국내 문서 대부분 해당) | 기능 전체 |

공통 원인: [src/lib/pdfLayout.js](../src/lib/pdfLayout.js), [src/operations/edit-pdf/helpers.js](../src/operations/edit-pdf/helpers.js),
[src/operations/watermark-pdf/helpers.js](../src/operations/watermark-pdf/helpers.js)의 `StandardFonts` 사용.
Phase 1에서 `@pdf-lib/fontkit` + 한글 TTF 서브셋 임베딩으로 일괄 해소합니다.

현재는 예외 메시지가 영문 원문(`WinAnsi cannot encode ...`)으로 그대로 노출됩니다.
데이터 손실은 없지만 사용자가 원인을 알 수 없으므로, Phase 1에서 한국어 안내로 치환합니다.

#### ⚪ 추가 테스트 필요 (5개)

| 도구 | 확인할 것 | 예상 |
|---|---|---|
| `fill-form-pdf` | 폼 필드에 한글 값 입력 후 저장·병합 | 저장 시 외관 생성 단계에서 폰트 예외 가능성 높음 |
| `crop-image` | 모바일 터치로 선택 영역 드래그 | [Cropper.jsx](../src/operations/crop-image/Cropper.jsx)에 `touch-action: none`이 없어 페이지 스크롤과 충돌 예상. `edit-pdf`는 오버레이에 설정되어 있어 정상 |
| `invert-image` | 구형 iOS Safari에서 색 반전 | Canvas `ctx.filter` 미지원 브라우저에서 무음 실패(원본 그대로 출력) 가능 |
| `organize-pdf`, `pdf-to-images` | **폰트 미임베딩 한글 PDF**의 렌더링 | [src/lib/pdfjs.js](../src/lib/pdfjs.js)가 `cMapUrl`/`standardFontDataUrl`을 의도적으로 비워둠 → 한글 글리프 깨짐 가능 |

> `organize-pdf`, `pdf-to-images`, `compress-pdf`, `edit-pdf`는 모두 pdf.js 렌더링에 의존하므로
> 위 cMap 이슈의 영향을 함께 받습니다. Phase 1에서 cMap·표준 폰트 데이터를 로컬 번들해 해소합니다.

---

## 2. 테스트 자산 준비

`docs/fixtures/` 아래에 다음을 준비합니다. **실제 개인정보가 들어간 파일은 사용하지 않습니다.**

| 파일 | 용도 |
|---|---|
| `ko-text.pdf` | 한글 텍스트 PDF (폰트 임베딩 O) |
| `ko-text-nofont.pdf` | 한글 텍스트 PDF (폰트 임베딩 X) — cMap 이슈 확인용 |
| `ko-scan.pdf` | 한글 스캔본 (텍스트 레이어 없음) — OCR 부재 확인용 |
| `en-multi.pdf` | 영문 다중 페이지 (10p 이상) |
| `form.pdf` | AcroForm 필드가 있는 PDF |
| `주민등록등본-샘플.pdf` | **한글 파일명** 처리 확인용 (내용은 더미) |
| `large.pdf` | 20MB 이상 — 성능·메모리 확인용 |
| `photo-gps.jpg` | EXIF·GPS가 포함된 사진 |
| `한글사진.png` | 한글 파일명 이미지 |
| `sample.docx` | 한글 본문 .docx |

---

## 3. 스모크 테스트 절차

각 도구마다 아래 6개 항목을 확인합니다.

| # | 확인 항목 | 판정 기준 |
|---|---|---|
| S1 | 지원 입력 형식 | 명시된 형식이 모두 열리고, 미지원 형식은 **한국어 오류 메시지**로 거부되는가 |
| S2 | 기본 동작 | 대표 입력 1건이 오류 없이 결과를 생성하고 다운로드되는가 |
| S3 | 한글 파일명 | 한글 파일명 입력 시 결과 파일명이 깨지지 않는가 (ZIP 포함) |
| S4 | 한글 콘텐츠 | 한글이 포함된 문서에서 결과물의 한글이 정상 표시되는가 |
| S5 | 모바일 | 모바일 화면 폭에서 레이아웃이 무너지지 않고, 터치 조작이 가능한가 |
| S6 | 오류 처리 | 암호화 PDF·손상 파일 투입 시 앱이 죽지 않고 안내 메시지를 보여주는가 |

### 공통 검증 (매 Phase 완료 시 필수)

| # | 항목 | 명령/절차 | 통과 기준 |
|---|---|---|---|
| C1 | 외부 네트워크 참조 | `node scripts/check-external-references.mjs` | 위반 0건 |
| C2 | 프로덕션 빌드 | `npm run build` | 성공 + **도구 페이지 24개 이상** 생성 |
| C3 | URL 보존 | `dist/` 하위 도구 디렉터리 목록 | 기존 24개 `id`가 **모두 그대로** 존재 |
| C4 | 런타임 네트워크 | DevTools → Network에서 전 도구 사용 | 자기 오리진 외 요청 0건 |
| C5 | 오프라인 동작 | 빌드 후 `npm run preview` → 네트워크 차단 → 새로고침 | 모든 도구 정상 동작 |
| C6 | 라이선스 고지 | `LICENSE`, `NOTICE` 파일 존재 및 원문 일치 | 원저작권 문구 무변경 |

### 테스트 환경

| 구분 | 대상 |
|---|---|
| 데스크톱 | Chrome 최신, Safari 최신 |
| 모바일 | iOS Safari, Android Chrome (실기기 또는 DevTools 디바이스 모드 375px) |

---

## 4. 결과 기록표

각 Phase 완료 시 이 표를 채워 보고합니다.
판정: ✅ 통과 / ⚠️ 제한적 통과 / ❌ 실패 / — 해당 없음

| 도구 | 분류 | S1 | S2 | S3 | S4 | S5 | S6 | 비고 |
|---|---|---|---|---|---|---|---|---|
| edit-pdf | 🔴 | | | | | | | |
| images-to-pdf | 🟢 | | | | | | | |
| pdf-to-images | ⚪ | | | | | | | |
| merge-pdfs | 🟢 | | | | | | | |
| split-pdf | 🟢 | | | | | | | |
| rotate-pdf | 🟢 | | | | | | | |
| organize-pdf | ⚪ | | | | | | | |
| compress-pdf | 🟡 | | | | | | | |
| watermark-pdf | 🔴 | | | | | | | |
| page-numbers-pdf | 🟢 | | | | | | | |
| extract-text | 🟡 | | | | | | | |
| pdf-to-word | 🟡 | | | | | | | |
| word-to-pdf | 🔴 | | | | | | | |
| fill-form-pdf | ⚪ | | | | | | | |
| compress-image | 🟢 | | | | | | | |
| resize-image | 🟢 | | | | | | | |
| convert-image | 🟢 | | | | | | | |
| crop-image | ⚪ | | | | | | | |
| strip-metadata | 🟢 | | | | | | | |
| rotate-flip-image | 🟢 | | | | | | | |
| watermark-image | 🟡 | | | | | | | |
| invert-image | ⚪ | | | | | | | |
| markdown-to-pdf | 🔴 | | | | | | | |
| html-to-pdf | 🔴 | | | | | | | |

---

## 5. 회귀 위험도 지도

공용 라이브러리를 수정할 때 **어떤 도구가 함께 깨질 수 있는지** 나타냅니다.
Phase 1 이후 공용 파일을 건드릴 때는 반드시 이 표의 영향 도구를 함께 테스트합니다.

| 공용 파일 | 영향받는 도구 | 위험도 |
|---|---|---|
| [src/lib/pdfLayout.js](../src/lib/pdfLayout.js) | markdown-to-pdf, html-to-pdf, word-to-pdf | 높음 (한글 폰트 작업 대상) |
| [src/lib/pdfjs.js](../src/lib/pdfjs.js) | edit-pdf, organize-pdf, pdf-to-images, compress-pdf, extract-text, pdf-to-word | **매우 높음** (6개 도구 공용, cMap 작업 대상) |
| [src/lib/imageCanvas.js](../src/lib/imageCanvas.js) | convert-image, crop-image, resize-image, rotate-flip-image, strip-metadata, pdf-to-images | 높음 |
| [src/lib/imageFormat.js](../src/lib/imageFormat.js) | 위 이미지 도구 전체 | 중간 |
| [src/lib/extractText.js](../src/lib/extractText.js) | extract-text, pdf-to-word | 중간 |
| [src/lib/download.js](../src/lib/download.js) | 전체 | 중간 |
| [src/lib/zip.js](../src/lib/zip.js) | split-pdf, pdf-to-images, watermark-image | 중간 |
| [src/registry/registry.js](../src/registry/registry.js) | **전체 24개** | **매우 높음** (도구 노출·숨김 작업 대상) |
| [src/hooks/useJob.js](../src/hooks/useJob.js) | 전체 | 중간 |
| [src/components/Dropzone.jsx](../src/components/Dropzone.jsx) | 전체 | 중간 |

신규 `redact-pdf`는 공용 파일을 **수정하지 않고 재사용만** 하는 방향으로 구현합니다.
공용 파일 수정이 불가피하면 위 영향 도구를 먼저 테스트한 뒤 진행합니다.
