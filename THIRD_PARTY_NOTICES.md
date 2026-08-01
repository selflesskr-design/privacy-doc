# 제3자 자산 및 라이선스 고지 (Third-Party Notices)

PrivacyDoc은 다음 제3자 저작물을 포함하거나 사용합니다.
각 항목의 라이선스 조건을 준수하며, 라이선스 원문을 저장소에 함께 포함합니다.

---

## 1. 원본 소프트웨어 (Upstream)

| 항목 | 내용 |
|---|---|
| 이름 | **DoxDock** |
| 저작권자 | Copyright (c) 2026 Mithun Srinivas |
| 라이선스 | MIT License |
| 라이선스 원문 | [LICENSE](LICENSE) — 원문 그대로 보존 |
| 출처 | https://github.com/mithun-srinivas/DoxDock |
| 기준 버전 | v1.4.0 (commit `27ed9f3`) |
| 사용 위치 | 저장소 전체. PrivacyDoc은 DoxDock의 파생 저작물입니다 |
| 비고 | 파생 관계와 변경 내역은 [NOTICE](NOTICE) 참조 |

---

## 2. 번들 폰트 (Bundled Fonts)

### Pretendard

| 항목 | 내용 |
|---|---|
| 이름 | **Pretendard** (Regular 400, static) |
| 저작권자 | Copyright (c) 2021, Kil Hyung-jin — with Reserved Font Name *Pretendard* |
| 라이선스 | **SIL Open Font License, Version 1.1 (OFL-1.1)** |
| 라이선스 원문 | [public/fonts/Pretendard-OFL.txt](public/fonts/Pretendard-OFL.txt) |
| 출처 | https://github.com/orioncactus/pretendard (npm `pretendard@1.3.9`) |
| 포함 파일 | `public/fonts/Pretendard-Regular.ttf` (2.6 MB) |
| 사용 위치 | [src/lib/koreanFont.js](src/lib/koreanFont.js) — pdf-lib으로 **PDF에 한글 텍스트를 그릴 때만** 임베딩 |
| 적용 도구 | `edit-pdf` (텍스트 도구), `watermark-pdf`, `fill-form-pdf` |

**포함 범위에 관한 결정**

- 가변 폰트(`PretendardVariable.ttf`)와 나머지 8개 굵기는 **포함하지 않습니다.**
  PDF 임베딩에 실제로 필요한 최소 구성인 **정적 Regular 400 한 종류만** 번들합니다.
- 이에 따라 PDF에 삽입되는 한글 텍스트는 항상 Regular 굵기로 그려지며,
  굵게(bold)·기울임(italic) 설정은 한글에 적용되지 않습니다.
- 추가 굵기는 실제 필요가 확인된 경우에만 확대합니다.

**OFL 준수 사항**

- 폰트 파일을 **수정하지 않고** 원본 그대로 포함합니다.
- OFL 원문(`Pretendard-OFL.txt`)을 폰트 파일과 같은 위치에 함께 배포합니다.
- 예약 폰트 이름 *Pretendard*를 변경하거나 단독으로 판매하지 않습니다.
- OFL은 소프트웨어 본체의 라이선스에 영향을 주지 않습니다. PrivacyDoc 소스 코드는 MIT를 유지합니다.

> **PDF 출력물에 대하여**
> 한글 텍스트를 포함한 PDF를 내보내면 사용된 글리프만 **서브셋**으로 PDF에 임베딩됩니다
> (전체 임베딩 약 1.2 MB → 서브셋 약 5 KB). OFL은 문서 임베딩을 허용합니다.

---

## 3. 런타임 의존성 (npm)

모든 의존성은 로컬 번들되며 런타임에 외부 네트워크 호출을 하지 않습니다.

| 패키지 | 라이선스 | 사용 위치 |
|---|---|---|
| `react`, `react-dom` | MIT | 앱 전체 |
| `pdf-lib` | MIT | PDF 생성·편집·저장 (`src/lib/pdfLayout.js`, 각 PDF 도구 `helpers.js`) |
| `@pdf-lib/fontkit` | MIT | 한글 폰트 임베딩 ([src/lib/koreanFont.js](src/lib/koreanFont.js)) |
| `pdfjs-dist` | Apache-2.0 | PDF 렌더링·텍스트 추출 ([src/lib/pdfjs.js](src/lib/pdfjs.js)) |
| `jspdf` | MIT | PDF 생성 보조 |
| `docx` | MIT | `.docx` 생성 (`pdf-to-word`) |
| `mammoth` | BSD-2-Clause | `.docx` 파싱 (`word-to-pdf`) |
| `browser-image-compression` | MIT | 이미지 압축 (`compress-image`) |
| `fflate` | MIT | ZIP 묶음 ([src/lib/zip.js](src/lib/zip.js)) |
| `vite`, `@vitejs/plugin-react` | MIT | 빌드 도구 (개발 의존성) |
| `tailwindcss`, `postcss`, `autoprefixer` | MIT | 스타일 (개발 의존성) |
| `vite-plugin-pwa` | MIT | 서비스워커 생성 (개발 의존성) |

각 패키지의 라이선스 원문은 `node_modules/<패키지>/LICENSE`에서 확인할 수 있습니다.

---

## 4. 브랜드 자산

| 항목 | 내용 |
|---|---|
| PrivacyDoc 로고 및 파생 아이콘 | Copyright (c) 2026 selflesskr. 서비스 브랜드 자산이며 MIT 적용 대상이 아닙니다 |
| 원본 파일 | `brand/logo-source.png` |

DoxDock 및 OSCode Community의 브랜드 자산(`oscode.png`, 원본 `og.png`, 원본 파비콘·PWA 아이콘)은
모두 제거되었습니다. MIT 라이선스는 저작권 고지 유지를 요구할 뿐 상표·브랜드 자산 사용을 허가하지 않으므로,
원저작권 고지는 [LICENSE](LICENSE)와 [NOTICE](NOTICE)에 텍스트로 유지하고 이미지 자산은 사용하지 않습니다.
