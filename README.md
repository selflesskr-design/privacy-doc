# PrivacyDoc (프라이버시독)

**브라우저 안에서만 동작하는 개인정보 안전 문서 도구. 열어본 파일은 내 기기 밖으로 나가지 않습니다.**

PDF와 이미지에 담긴 개인정보를 안전하게 가리고, 문서를 합치고, 용량을 줄입니다.
모든 처리는 **사용자의 브라우저 안에서** 이루어집니다. 서버 없음, 가입 없음, 추적 없음, 네트워크 요청 없음.

계약서·급여명세서·등본·진단서처럼 남에게 맡기기 꺼려지는 파일을 다룰 때,
정체를 알 수 없는 온라인 변환 사이트에 업로드하지 않고 처리하기 위해 만들었습니다.

> ⚖️ 이 프로젝트는 MIT 라이선스로 공개된 오픈소스 **[DoxDock](https://github.com/mithun-srinivas/DoxDock)** (Copyright © 2026 Mithun Srinivas)의 파생 저작물입니다.
> 자세한 내용은 [LICENSE](LICENSE)와 [NOTICE](NOTICE)를 참고하세요.

---

## 왜 "증명 가능한 로컬 처리"인가

대부분의 "무료 온라인 PDF 도구"는 파일을 알 수 없는 서버로 업로드합니다.
PrivacyDoc은 그 반대이며, **말로만 약속하지 않고 기술적으로 증명**합니다.

1. **엄격한 CSP가 네트워크 접근 자체를 금지합니다.** [index.html](index.html)의 `connect-src 'self'` 설정 때문에, 브라우저가 자기 오리진 외부로 나가는 모든 `fetch`/`XHR`/`WebSocket`을 **거부**합니다. 나중에 누군가 외부 전송 코드를 넣더라도 브라우저가 막습니다.
2. **모든 자산이 로컬 번들입니다.** 폰트, 아이콘(인라인 SVG), pdf.js 워커, WebAssembly까지 전부 앱 자체에서 제공됩니다. CDN 링크도, 외부 폰트도, 트래커도 없습니다.
3. **오프라인으로 동작하는 PWA입니다.** 첫 로드 이후 서비스워커가 모든 것을 캐시합니다. 인터넷을 끊어도 모든 도구가 그대로 동작합니다.
4. **CI가 매 변경마다 검사합니다.** [scripts/check-external-references.mjs](scripts/check-external-references.mjs)가 소스 내 외부 URL 참조를 정적 분석해 발견 시 빌드를 실패시킵니다.

### 직접 확인하는 방법 (30초)

- 개발자도구 → **네트워크** 탭을 열고 아무 도구나 사용해 보세요. 자기 오리진 요청 외에는 아무것도 발생하지 않습니다.
- 또는 앱을 한 번 연 뒤 **완전히 오프라인**(비행기 모드)으로 전환하고 새로고침해 보세요. 모든 기능이 그대로 동작합니다.
- 또는 소스를 직접 읽어보세요. MIT 라이선스이고 규모가 작습니다. `connect-src 'self'`는 [index.html](index.html)에, pdf.js 워커 번들 설정은 [src/lib/pdfjs.js](src/lib/pdfjs.js)에 있습니다.

`localStorage`에는 **민감하지 않은 UI 상태**(테마, 사이드바 접힘)만 저장합니다. 파일 내용은 저장되지도, 전송되지도 않습니다.

---

## 시작하기

```bash
npm install

# 개발 서버 (http://localhost:5173)
npm run dev

# 프로덕션 빌드 -> dist/
npm run build

# 빌드 결과 미리보기
npm run preview

# 외부 네트워크 참조 정적 검사
node scripts/check-external-references.mjs
```

요구 사항: Node 18+. 백엔드도, 환경 변수도, 띄워야 할 서비스도 없는 정적 사이트입니다.

## Docker로 실행

```bash
docker compose up --build
# http://localhost:8791
```

멀티스테이지 빌드(Node가 빌드하고 nginx가 서빙)라 최종 이미지에는 정적 파일만 들어갑니다.
컨테이너를 인터넷에서 완전히 분리해도 모든 기능이 동작합니다.

---

## 제공 도구

클라이언트 처리 특성상 한계가 있는 도구는 UI와 아래 표에 그 한계를 그대로 밝힙니다.

### PDF

| 도구 | 기능 | 주의 사항 |
|---|---|---|
| Edit PDF | 텍스트·그림·형광펜·도형·이미지·화이트아웃을 덧씌우고 내보낼 때 굽기 | 기존 내용 위에 덧그리는 방식. **개인정보 보호 목적에는 적합하지 않음** |
| Images → PDF | 여러 이미지를 순서대로 한 PDF로 결합 | — |
| PDF → Images | 각 페이지를 PNG/JPEG로 내보내기 (ZIP 다운로드) | — |
| Merge PDFs | 여러 PDF 합치기, 드래그로 순서 변경 | 암호화된 PDF 미지원 |
| Split PDF | 페이지 범위 추출 또는 낱장 분리 | 암호화된 PDF 미지원 |
| Rotate PDF | 전체 또는 선택 페이지를 90/180/270° 회전 | — |
| Organize PDF | 썸네일로 페이지 순서 변경·삭제 | — |
| Compress PDF | 페이지 재인코딩 + 메타데이터 제거, 전후 용량 비교 | 문서에 따라 결과 편차가 큼. 재인코딩 시 텍스트 선택 불가 |
| Watermark PDF | 텍스트 워터마크(중앙/타일), 투명도·각도 조절 | **한글 텍스트 미지원** (아래 참고) |
| Add Page Numbers | 위치·형식을 지정해 페이지 번호 삽입 | — |
| Extract Text | 일반 텍스트 또는 마크다운으로 추출 | 텍스트 기반 PDF만 가능, **OCR 없음** |
| PDF → Word | PDF 텍스트를 편집 가능한 `.docx`로 추출 | **텍스트만** 추출. 표·이미지·다단 레이아웃 미보존 |
| Word → PDF | `.docx`를 PDF로 변환 | **근사 레이아웃**. **한글 텍스트 미지원** |
| Fill PDF Form | AcroForm 필드 채우기 및 병합 | 실제 폼 필드가 있는 PDF만 |

### 이미지

| 도구 | 기능 | 주의 사항 |
|---|---|---|
| Compress Image | 품질 슬라이더, 전후 용량 비교 | PNG는 무손실 — 큰 절감은 JPEG/WebP 변환 필요 |
| Resize Image | 픽셀 또는 퍼센트로 크기 조절 | — |
| Convert Image Format | PNG ↔ JPEG ↔ WebP | — |
| Crop Image | 드래그로 영역 선택 후 자르기 | — |
| Strip Image Metadata | 재인코딩으로 EXIF·GPS 제거 | — |
| Rotate / Flip Image | 90° 단위 회전 및 좌우·상하 반전 | — |
| Watermark Image | 텍스트 또는 로고 오버레이 | — |
| Invert Image Colors | 색상 반전 | — |

### 변환

| 도구 | 기능 | 주의 사항 |
|---|---|---|
| Markdown → PDF | 마크다운을 PDF로 렌더링 | **한글 텍스트 미지원** |
| HTML → PDF | HTML을 PDF로 렌더링 | **근사 레이아웃**. **한글 텍스트 미지원** |

> **한글 관련 알려진 제한**
> PDF에 텍스트를 그리는 기능은 pdf-lib의 표준 폰트(WinAnsi 인코딩)를 사용하므로 현재 한글을 출력할 수 없습니다.
> 한글 폰트 임베딩 작업이 완료되기 전까지는 위 표에 표시된 도구에서 한글 입력 시 오류가 발생합니다.

---

## 기술 스택

- **React 18 + JSX** + **Vite 5**
- **Tailwind CSS 3** (라이트/다크 테마)
- **vite-plugin-pwa** — 오프라인 서비스워커
- 전부 로컬 번들되는 클라이언트 라이브러리: `pdf-lib`, `pdfjs-dist`(워커 번들), `jspdf`, `docx`, `mammoth`, `browser-image-compression`, `fflate`. 여기에 브라우저 **Canvas** API.

런타임에 네트워크 호출을 하는 의존성은 없습니다. 무거운 작업(pdf.js 렌더링, 이미지 압축)은 웹 워커에서 처리합니다.

## 아키텍처

플러그인/레지스트리 구조입니다. 각 도구는 `src/operations/<id>/` 아래의 독립 폴더이며,
`meta.js`(메타데이터) + `index.jsx`(UI) + `helpers.js`(순수 로직)로 구성됩니다.
[src/registry/registry.js](src/registry/registry.js)가 `import.meta.glob`으로 자동 발견하므로,
도구 추가는 폴더 하나를 넣는 것으로 끝납니다. 중앙 switch문이 없습니다.

브랜드명과 배포 도메인은 [src/config/site.js](src/config/site.js) 한 곳에서 관리합니다.

---

## 라이선스

[MIT](LICENSE)

- 원저작물: **DoxDock** — Copyright © 2026 Mithun Srinivas — https://github.com/mithun-srinivas/DoxDock
- 수정 부분: Copyright © 2026 selflesskr

MIT 라이선스에 따라 원저작권 고지와 허가 고지를 [LICENSE](LICENSE) 파일에 원문 그대로 보존하고 있습니다.
파생 사실과 변경 내역은 [NOTICE](NOTICE)에 정리되어 있습니다.
