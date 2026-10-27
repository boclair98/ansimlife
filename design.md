# OpenUI Design Plan

## Variant 1 — 토스뱅크 아티클의 읽기 편한 구성

### 서비스와 현재 근거
안심생활은 정부·지자체의 실제 공고를 검색·비교하고 공식 기관 신청을 준비하는 독립 서비스다. 사용자 첫 행동은 검색이며 실제 제출은 연결된 공식 기관에서 이루어진다. 현재 Npay 목록형은 14px 본문·70px 행·작은 제목·중앙 아이콘 상세로 촘촘해 사용자가 거듭 거절했다. 새 기준은 사용자가 직접 보낸 https://www.tossbank.com/articles/youth-2026 이다. 2026-10-28 실제 DOM에서 PC 본문 폭660px, 제목36px/46.8px/700, 소제목24px/38.4px/700, 본문17px/27.2px/400을 확인했다. 원본은 OS 다크 모드에서 검은 배경으로 열렸으나, 이 서비스는 전 연령 가독성에 맞는 흰 배경으로 정한다.

### Resolved inputs
- Topic: 안심생활 공공혜택 검색과 신청 준비
- Offer: 공식 공고 검색·상세·저장·비교·계정별 준비 체크·결과 기록·PDF 안내문
- Audience: 남녀노소 한국어 모바일·PC 이용자
- Primary user action: 혜택 검색 후 공식 상세를 읽고 신청 준비로 이동
- Deliverable: 기존 Spring Boot 정적 HTML/CSS/JS 전체 서비스 화면
- Style direction: 사용자가 지정한 Tossbank youth-2026 기사의 넓은 문단·타이포그래피 중심 편집 디자인
- Tonal key: Light: 흰 배경·짙은 회색 텍스트·절제한 파란 조작 색상
- Icon policy: 기존 SVG 아이콘을 탐색·조작에만 사용
- Proof assets: 실제 공공데이터 API 공고와 공식 상세·출처·조회 시간
- Motion intensity: Minimal: 조작 피드백만, reduced-motion 지원

### Composition contract
- Hero archetype: asymmetrical, 한 열 좌측 정렬의 기사 도입부
- First-viewport structure: 72px 헤더와 56px 메뉴 → 생활 혜택 레이블 → 36px 두 줄 제목과 17px 설명 → 실제 검색 폼 → 생활 상황 탐색 → 공고 제목과 첫 실제 공고
- Primary visual/proof artifact: 실제 공고 목록. 타사 삽화·로고나 장식용 가짜 UI를 제품에 넣지 않는다.
- Interaction behavior: 검색은 기존 searchForm submit, 상황 탐색은 기존 topic handlers, 상세는 data-action=detail, 주 CTA는 benefitDetailPrepare. 보조 CTA는 benefitDetailOfficial이다. 필터·저장·비교·로그인·준비·PDF의 기존 계약을 유지한다.
- Reuse boundary: 전체 서비스에 동일한 타이포그래피·색·간격·컨트롤을 적용하되 목록·본문·폼·비교표는 콘텐츠에 맞는 고유 배치를 유지한다.

### 토큰과 실제 적용
- 글꼴: 원본은 산돌이 토스를 위해 제작한 Toss Product Sans. 서비스에는 공식 Pretendard v1.3.9 Variable WOFF2를 같은 출처의 SIL OFL과 함께 자체 호스팅한다. 폰트 원본을 Toss 서체라고 표시하지 않는다. 대체 순서는 Pretendard Variable, Pretendard, -apple-system, BlinkMacSystemFont, Apple SD Gothic Neo, Noto Sans KR, sans-serif.
- 배경#ffffff, 제목#191f28, 본문#333d4b, 보조#6b7684, 선#e5e8eb, 연한 면#f2f4f6, 주요 버튼#0064ff/흰색, 선택면#e8f3ff/#1b64da.
- PC 제목36px/1.3/700, 섹션24px/1.6/700, 공고 제목22px/1.45/650, 본문17px/1.6/400, 폼·조작16~17px/1.5/600. 모바일 제목28~30px/1.35/700, 공고 제목19px/1.45. 작은 보조 정보도14px 미만으로 줄이지 않는다.
- 읽기 폭660px: 기본 영역720px+좌우30px, 상세760px+좌우50px. 모바일 좌우24px, 360px도 넘침 없이 유지.
- 제목·문단 간격16~24px, 섹션 간격40~64px, 목록 정보행은104px 이상으로 확장. 억지로 한 행70px에 맞추지 않는다.
- 주 버튼56px·반경14px·17px/600, 보조48px·반경12px·16px. 입력56px·반경12px·레이블16px. 보조 아이콘 조작44px 이상.
- 헤더는 흰색72px, 메뉴56px. 좁은 화면 헤더64px·메뉴52px. 상단 조작은 한 줄, 메뉴·상황 탐색은 필요시 의도한 가로 스크롤.

### 화면별 구성
1. 메인: 패널로 감싸지 않는 기사형 도입부와 실제 검색. 큰 제목·설명 뒤 검색과 상황 탐색, 실제 목록. 목록은 분야·지역 → 제목 → 지원 내용 순서.
2. 상세: 중앙100px 장식 아이콘을 제거하고 분야·지역 → 36px 제목 → 17px 요약 → 56px 신청 준비 CTA 순서로 좌측 정렬. 기간·지역·기관, 대상·지원·서류·접수·출처는 기사처럼 충분한 행간과 섹션 여백을 둔다.
3. 저장·준비 목록:24~30px 제목,16~17px 본문, 중복 테두리 없는 검색, 편한 요약 정보행, 실제 저장 기록.
4. 설정: 넓은 설정 행과56px 글자 선택,17px FAQ. 키보드와 큰 글자에서 읽기 유지.
5. 로그인·회원가입·계정: 460px 폼,32px 제목,56px 입력,56px 주 CTA. 테스트에는 일회용 로컬 계정을 쓴다.
6. 맞춤 조건: 기존 필수 항목·제출·서버 저장 유지. 56px 필드와48px 이상 선택 항목.
7. 준비 3단계:24px 프로그램 제목·명확한 진행표시·17px 본문. 중첩 스크롤 없이 본문만 스크롤. 공식 접수처 이동이 주 행동인 단계에서는 나머지 버튼을 보조 스타일로 구분.
8. 비교: 가로 스크롤은 표 안에만 유지, 16px 이상 텍스트와 충분한 셀 패딩.
9. 정보 수정·안내문: 실제 폼과 오류 상태, 동일한 기사형 본문, PDF 주 CTA.
10. 펼친 필터: 실제 category-shortcuts DOM의 두 열·44px 이상 버튼을 보존. 선택 후 결과로 돌아가는 동작 유지.

### 경로·계약·검증
수정 경로: design.md, static/index.html, static/product.css, static/fonts/PretendardVariable.woff2, static/fonts/Pretendard-OFL.txt, README.md. API·인증·프로필·준비 저장·PDF·공식 조회와 ID는 유지한다. service-ui.js 등 기능 변경은 오류가 확인된 경우에만 최소로 한다. CSS는 기존 동작 규칙을 보존하고 새 시각 값으로 정리하며 오래된 모바일 규칙을 무작정 덧대지 않는다. 타사 전용 폰트·로고·삽화는 가져오지 않는다.
실제 브라우저에서360×800,390×844,768×1024,1440×900의 메인·저장·준비 목록·설정·상세·맞춤·비교·준비3단계·정보수정·가이드·인증을 확인한다. 큰 글자, 펼친 필터, 검색·상세 API·저장·계정별 준비 저장·PDF 다운로드·키보드·콘솔을 확인한다. Java 빌드/관련 테스트와 기존 JS9개 테스트를 수행한다. 기존 배포 요청에 따라 upstream push → 실제 fork 동기화와 SHA 대조 → 기존 Coders 프로젝트 재배포 → 운영 화면·자산·API 확인 순서를 지킨다.

### Filled generation prompt
Create one high-concept page for 안심생활 공공혜택 검색과 신청 준비.

## Inputs
- Topic: 안심생활 공공혜택 검색과 신청 준비.
- Offer: 공식 공고 검색·상세·저장·비교·계정별 준비 체크·결과 기록·PDF 안내문
- Audience: 남녀노소 한국어 모바일·PC 이용자
- Primary user action: 혜택 검색 후 공식 상세를 읽고 신청 준비로 이동
- Deliverable: 기존 Spring Boot 정적 HTML/CSS/JS 전체 서비스 화면
- Style direction: 사용자가 지정한 Tossbank youth-2026 기사의 넓은 문단·타이포그래피 중심 편집 디자인
- Tonal key: Light: 흰 배경·짙은 회색 텍스트·절제한 파란 조작 색상
- Icon policy: 기존 SVG 아이콘을 탐색·조작에만 사용
- Proof assets: 실제 공공데이터 API 공고와 공식 상세·출처·조회 시간
- Motion intensity: Minimal: 조작 피드백만, reduced-motion 지원

## Objective
Design one premium, memorable page with a dominant hero and one coherent visual world derived from the topic itself.
The result should feel specific, intentional, and action-oriented when the concept calls for action, not like a generic startup or SaaS template.

Choose the strongest clear solution.
Do not collapse the concept into a simpler generic pattern just to make execution easier.

- Treat single-file execution as a packaging constraint, not a creative constraint.
Do not reduce conceptual ambition, visual specificity, interaction richness, or production quality merely because the deliverable is concise.

## Internal concept choice
Before composing, decide internally:
- one dominant hero archetype: centered / asymmetrical / immersive
- one dominant proof mode: none / embedded gesture / single artifact
- one palette driver derived from the topic
- one tonal key: light / mid / dark / topic-derived
- one motion role: none / minimal / ambient / interactive
- one icon approach: none / minimal / expressive / topic-native
- optionally one secondary accent only if it strengthens the main direction without creating a second visual world
Do not output this planning.

## Non-negotiables
- Use a strong hero-first composition.
- Headline: 3-12 words, max 3 lines.
- Supporting copy: 1-2 short sentences, concise and specific.
- CTAs are optional. If used, include at most 1 primary and 1 secondary CTA.
- If a clear next step is central to the offer or concept, include a CTA; otherwise CTA omission is allowed.
- CTA labels must be specific to the offer and action, not generic.
- Supporting highlights are optional. If used, show them only once in a single lower support cluster beneath the hero.
- Keep the hero dominant, focused, readable, and uncluttered.
- Proof is optional. Use it only if it clearly strengthens the concept.
- If no real proof assets are provided, do not invent metrics, testimonials, customer logos, screenshots, or fake UI proof.
- Prefer depth inside the hero, proof gesture, CTA behavior, support copy, or background logic rather than adding extra sections by default.

## Composition
- Choose the clearest structure for the topic; do not default to generic two-column marketing layouts.
- A top navigation bar is optional. When used, make it native to the chosen style direction and subordinate to the hero rather than a generic boxed header.
- The hero may be fully integrated rather than framed.
- The hero does not need to become a panel, dashboard, device mockup, rounded card, or floating showcase unless the topic genuinely demands that artifact.
- Build hierarchy through scale, contrast, spacing, alignment, depth, rhythm, and composition before using frames, dividers, or containers.
- Keep supporting content clearly subordinate to the hero.
- Do not interpret structural restraint as permission to flatten the concept into a generic minimal layout.
- Do not use text-on-text layering, typographic collisions, or overlapping live text as a compositional device.

## Visual system
- Build one coherent visual world derived from the topic itself.
- Let the topic drive palette, contrast, typography, spacing, geometry, motifs, materials, and motion.
- Even restrained palettes must feel intentional and specific, not generic premium-neutral.
- The background must actively contribute mood, depth, and topic logic.
- If the topic suggests a real system language, physical behavior, or interface grammar, show that directly instead of generic abstract-tech decoration.
- Treat headline typography as part of the concept, not neutral text.
- The headline may use topic-derived color, selective emphasis, multi-tone treatment, or gradient accents when they strengthen the concept and remain readable.
- Do not default the headline to neutral black, white, or near-white unless that is clearly the strongest topic-native choice.

## Background and tonal diversity
- Premium and atmospheric design may be light, mid-tone, or dark; do not default to dark.
- Choose the tonal key from the topic, offer, audience, and style direction rather than from generic cinematic or tech aesthetics.
- Contrast may come from hue, saturation, temperature, texture, density, or scale, not only darkness.

## Proof and concept expression
- Prefer the minimum visual evidence needed to make the idea feel specific, credible, and native to the topic.
- If the concept is strongest with typography, atmosphere, and one precise gesture, do that.
- If a stronger proof artifact is justified, use one legible, unified artifact rather than multiple fragmented panels.
- Proof may take the form of a signal, trace, contour, command line, path, specimen, structural mark, scene fragment, or other topic-native evidence.
- Typography itself may carry part of the concept or proof.
- When appropriate, use one precise typographic gesture—such as selective word emphasis, chromatic offset, gradient emphasis, distortion, signal breakup, or structural interruption—to make the concept feel more specific and alive.
- Prefer one strong typographic intervention over many scattered decorative effects.
- Avoid decorative pseudo-proof.
- Avoid turning simple ideas into framed showcases, dashboard fragments, floating panels, softened slabs, or generic marketing geometry.

## Icons and symbolic language
- Icons are optional.
- Use icons only when they improve scanability, recognition, navigation, proof clarity, or support-cluster legibility.
- Prefer topic-native icon logic over generic startup glyphs.
- Keep icon style consistent in stroke weight, geometry, corner logic, and detail level.
- Use icons primarily in clearly secondary roles unless a single topic-native symbol is central to the concept.
- Do not let icons compete with the hero headline, proof artifact, or CTA hierarchy.

## Support cluster
- If used, show supporting highlights only once, in a single lower cluster beneath the hero.
- Each highlight should be short, fast to scan, and clearly secondary.
- Supporting highlights may use concise icons or symbolic marks when helpful.
- Support-cluster elements may use subtle motion when it improves scanability, continuity, or atmosphere and remains clearly secondary.
- Card-like grouping is allowed only inside this lower support cluster.
- These modules may use at most one light surface treatment, such as a subtle stroke, tonal fill, or very soft shadow.
- Keep support modules uniform, non-nested, and visually subordinate.
- Do not use card-like structures in the hero, proof, CTA area, or elsewhere on the page.

## Motion
- Motion is optional.
- Use motion only when it supports hierarchy, continuity, feedback, atmosphere, or topic logic.
- Default to none, minimal, or ambient motion depending on what the concept actually needs.
- Motion may live in typography, background behavior, proof logic, support-cluster behavior, or interaction feedback.
- A single key word or short phrase may use subtle text-based motion such as glitch, flicker, jitter, scanline shift, chromatic split, text scramble, pulse, or reveal if it strengthens the concept.
- Keep motion controlled, readable, non-blocking, and subordinate to clarity.
- Avoid scrolljacking, attention-hijacking loops, and ornamental animation.
- Respect reduced-motion preferences.

## Accessibility and readability
- Preserve strong readability and clear hierarchy at all viewport sizes.
- Maintain sufficient contrast between text and background.
- Do not place essential text over busy imagery unless readability remains strong.
- Avoid cramped spacing, visual collisions, and weak focal hierarchy.
- Do not place badges, pills, annotations, stickers, or floating interface fragments over essential text.
- If the deliverable is code, use semantic HTML structure, visible focus states, keyboard-friendly interactions, and reduced-motion handling.
- When in doubt, preserve legibility over expressive overlap.

## Anti-drift rules
- Do not drift into bland corporate SaaS styling.
- Do not default to dashboard aesthetics, feature-grid thinking, boxed-section composition, or template-like modularity.
- Do not use disconnected motifs, random color choices, or interchangeable abstract-tech shapes.
- Do not use card-within-card composition, nested surfaces, floating panels, fake proof, or stock-looking UI.
- Keep one visual world, one dominant hero, and one clear structural logic.
- Do not allow text, labels, or interface elements to overlap, collide, or sit on top of one another.

## Output
Return only the final 기존 Spring Boot 정적 HTML/CSS/JS 전체 서비스 화면.

If the deliverable is code:
- Output a complete production-ready file or component.
- Keep dependencies minimal unless explicitly requested.
- Make it responsive.
- Keep support highlights in one lower support cluster only when used.

## Final self-check
Before returning, verify that the result keeps:
- one dominant hero
- one coherent visual world
- no invented proof
- no cardification outside the lower support cluster
- no generic SaaS drift
- no unnecessary structural fragmentation
- no nested containment
- no floating sub-surfaces
- all text clearly legible and comfortably spaced

### Output target
src/main/resources/static/index.html 및 product.css와 폰트 자산. 기존 서비스 전체 화면을 직접 수정한다.

<details><summary>이전 디자인 기록</summary>

<!-- final-qa-notes -->
최종 조정: PC 목록의 과거 최소높이(제목54px·설명46px)를 해제해 첫 행 y287·기본70px로 맞춤. 준비목록 요약은 좁은 화면의 한 글자 줄바꿈을 막는 단일 열 정보행으로 구성. 비교창은 전 폭이 아닌681px. 큰 글자360px에서 헤더는 한 줄 조작을 유지하고 본문·폼의 사용자 글자 크기를 보존. 검색 필드 중복 테두리·준비서류 중첩 스크롤·중복 본문 패딩을 제거.

# OpenUI Design Plan

## Variant 1 — 2026-10-28 전체 화면 대조 수정

사용자가 원본과 나란히 비교해 폰트뿐 아니라 배치·간격·버튼과 모든 페이지를 다시 맞추라고 요청했다. 기존 단순 폰트 교체 결과는 승인된 디자인으로 보지 않는다. API·계정·저장 데이터·신청 준비·PDF 계약은 보존한다.

### Resolved inputs
- Topic: 안심생활 공공혜택 탐색과 신청 준비
- Offer: 실제 공식 공고 검색·저장·비교·상세·체크리스트·진행 기록·안내문
- Audience: 한국어 모바일·PC 이용자 전 연령
- Primary user action: 공고를 찾고 공식 상세·서류를 확인하고 준비
- Deliverable: 기존 실제 서비스의 모든 화면과 원본/구현 비교 보드
- Style direction: 네이버페이 공개 메인·상세의 실제 구성과 컴포넌트 규칙 직접 재현
- Tonal key: 흰 중앙 화면, #f3f5f7 구분 띠, #1e1e23 본문, #defae4 연녹색 행동
- Icon policy: 기존 안심생활 SVG 유지; 타사 로고/상품 이미지를 서비스 자산으로 복제하지 않음
- Proof assets: 같은 390×844/1440×900에서 촬영한 원본·실제 서비스, 실제 API 데이터
- Motion intensity: Minimal, reduced-motion 존중

### 원본 조사와 수정 근거
- 메인: https://pay.naver.com/benefit/payment/list?firstCategory=ONLINE
- 상세: https://pay.naver.com/benefit/payment/detail/24278798653388
- 390px 원본: 헤더 56px+탭 40px, 배너 y120/h97, 칩 시각 높이32/y236, 첫 공고 y287, 썸네일70, 행 간격14. 기존 구현은 추가 제목/비교 바/큰 칩 때문에 목록이 뒤로 밀렸다.
- 상세 원본: 헤더56, 100px 중앙 이미지(y66), 이름20px/26px·상단25px, 강조20px, 설명16px/22px·위6px, CTA 위24px·높이48px·반경6px·#defae4. 이후9px 회색 띠, 정보행 padding16px/0·라벨16px bold·값16px·간격8px.
- 기존 상세·준비 화면에는 큰 회색 카드·검정 고정 버튼·좌측 마케팅 칼럼·과도한 패딩이 남아 있었다. 이 구조를 제거하고 흰 단일 열+평평한 정보 구획+연녹색48px 행동으로 통일한다.
- 참여내역은 로그인으로 연결돼 비공개 원본 내용을 확인하지 않는다. 로그인 입력값을 캡처하거나 이용하지 않는다. 저장·준비·설정·비교는 공개 메인/상세의 확인된 리스트·정보행·폼·버튼 규칙을 적용하며 비공개 페이지를 복제했다고 주장하지 않는다.

### Composition contract
- Hero archetype: centered, 원본과 같은 작은 검색 배너. 대형 홍보 영역 없음.
- First-viewport structure: 56px 헤더→40px 탭→97px 검색 모듈→시각32px/조작44px 상황 칩→목록. 결과 제목과 추가 조작은 필터 팝오버로, 비교 선택은 헤더 버튼으로 모아 첫 목록 위치를 원본 y287에 맞춘다.
- Primary visual/proof artifact: 실제 공고의 70px 분야 아이콘, 제목·요약·기한. 상세는 100px 자체 아이콘과 실제 공고 제목·설명·공식 데이터.
- Interaction behavior: 기존 검색/필터/저장/비교/계정/폼/새로고침/PDF를 같은 핸들러로 연결. 행 더보기는 저장·비교를 제공하고 키보드/Escape/포커스 복귀를 지원한다.
- Reuse boundary: 기존 스택, JS 상태·API·스토리지 ID 유지. HTML에서 같은 컴포넌트를 재배치하고 낡은 service.css 시각 중복을 제거해 product.css 한 체계로 관리한다.

### 페이지별 구성과 구체적 토큰
- 공통: PC 중앙 외곽681~689/내부641, 모바일20px 좌우, 시스템 글꼴 유지, 기본14/20·주요본문16/22·제목20/26. 버튼48/6px, 입력52/6px, 정보 구획간9px 띠 또는1px선, 행16px 패딩, 24px 섹션 여백. 포커스와 대비 유지.
- 메인/저장: 평면 한 열, 상단 카테고리14→제목16→설명14. 리스트의 큰 대상 보조행은 상세에서 제공하고 목록 설명은 실제 지원내용 미리보기. 더보기 메뉴로 저장·비교 유지. 긴 공고 제목은2행이라 원본 상품행보다 높이가 늘어날 수 있다.
- 상세: 56px 뒤로/공유 헤더, 중앙100px 아이콘·분야·20px 제목·16px 설명, 48px 연녹색 준비 CTA. 저장/공식 안내/PDF 보조 조작은 작은 유틸리티 행. 이후 기간·지역·담당기관과 대상·서류·연락처를 평평한 행으로 표시. 큰 회색 카드와 검정 하단 슬랩 제거.
- 준비실: 모든 크기에서 흰 단일 열, 왼쪽 마케팅 패널 제거, 56px 헤더와 실제 공고 제목, 3개 밑줄 단계. 체크리스트52px/체크20, plain 정보행·입력52, 하단48px 이전/다음/공식안내. 진행 데이터와 직접 기록 의미 유지.
- 저장/준비 목록: 제목20, 설명14, 검색44, 과장된 빈 상태·큰 색 면적 제거. 계정 기록·다음 확인일·정렬/검색/일정 유지.
- 설정: 큰 글자 타일을44px 세그먼트로, 메뉴를52px 정보행으로. FAQ flat 구분선, 폰트3단계 유지.
- 로그인/회원가입/계정: 광고 칼럼 없이 중앙460px 폼, 브랜드와20px 제목, 입력52px/6px·라벨14·필드간20px·CTA48. 비밀번호/계정값을 비교 보드에 노출하지 않음.
- 맞춤·정보수정: 단일 열 폼, 필드간24px, 선택지44px/6px, 고정48px CTA. 실제 레이블과 선택/오류 상태 유지.
- 비교: 같은681px 화면, 내부 표만 수평 스크롤,14px/20px 셀·14px padding, 하단48px 행동. 기존 최대3개/공유/삭제 유지.
- 안내문: 같은56px 헤더/48px 내려받기, 흰 문서·20px 제목·16px 본문·24px 구획. 서버 PDF는 기존 임베드 서체와 생성 계약 유지.
- 출처·동기화 실패·빈 결과·loading·success 상태를 실제 API 기준으로 유지. 한국어 keep-all/min-width:0, safe-area, reduced-motion과 키보드 표시를 검증.

### 실행·검증·비교 보드
- 실제 수정: index.html, app.js, service-ui.js, product.css, service.css, README.md. 백엔드/키/DB 변경 없음.
- 실제 버튼 목적지: 검색→searchForm, 상세→openBenefitDetail, 준비→openPreparation, 계정→authForm, PDF→guidePrint, 더보기→기존save/compare 핸들러.
- 동일 크기 원본/개선 결과를 HTML 비교 보드의2열에 배치하고 메인·상세·저장·준비·설정·계정·맞춤·비교·안내문을 빠짐없이 확인한다. 인증된 원본이 없는 화면은 공개 컴포넌트 기준임을 구분한다.
- 360×800·390×844·768×1024·1440×900, 큰 글씨·검색/빈 상태·row menu·비교·폼·준비3단계·실제PDF·키보드·콘솔 검증. 관련 정적/JS 테스트와 빌드, 원본push→fork동기화→배포→운영검증.

### Filled generation prompt
Create one high-concept page for 안심생활의 공공혜택 검색·저장·비교·신청 준비.

## Inputs
- Topic: 안심생활의 공공혜택 검색·저장·비교·신청 준비.
- Offer: 공식 API 공고와 상세·제출서류·PDF·계정별 준비 기록
- Audience: 전 연령의 한국어 이용자, 모바일 우선
- Primary user action: 검색 또는 상황 선택으로 혜택을 찾고 공식 상세를 확인
- Deliverable: 기존 Spring Boot와 vanilla HTML/CSS/JS 실제 서비스, 홈페이지와 연결된 전체 화면
- Style direction: 실측한 네이버페이 결제혜택의 시스템 글꼴·좁은 1열·평면 목록·상단 밑줄 탭을 직접 재현
- Tonal key: Light, 흰 콘텐츠와 #f3f5f7 외부 바탕, #1e1e23 본문, 짙은 선택 칩
- Icon policy: 기존 안심생활 SVG를 70px 분야 썸네일에 사용, 타사 로고와 이미지는 사용하지 않음
- Proof assets: 실제 API 공고와 조회 시각, 원본 화면의 실제 측정 기록; 가상 성과 없음
- Motion intensity: Minimal, 상태 피드백만 사용하고 reduced-motion 유지

## Objective
Design one premium, memorable page with a dominant hero and one coherent visual world derived from the topic itself.
The result should feel specific, intentional, and action-oriented when the concept calls for action, not like a generic startup or SaaS template.

Choose the strongest clear solution.
Do not collapse the concept into a simpler generic pattern just to make execution easier.

- Treat single-file execution as a packaging constraint, not a creative constraint.
Do not reduce conceptual ambition, visual specificity, interaction richness, or production quality merely because the deliverable is concise.

## Internal concept choice
Before composing, decide internally:
- one dominant hero archetype: centered / asymmetrical / immersive
- one dominant proof mode: none / embedded gesture / single artifact
- one palette driver derived from the topic
- one tonal key: light / mid / dark / topic-derived
- one motion role: none / minimal / ambient / interactive
- one icon approach: none / minimal / expressive / topic-native
- optionally one secondary accent only if it strengthens the main direction without creating a second visual world
Do not output this planning.

## Non-negotiables
- Use a strong hero-first composition.
- Headline: 3-12 words, max 3 lines.
- Supporting copy: 1-2 short sentences, concise and specific.
- CTAs are optional. If used, include at most 1 primary and 1 secondary CTA.
- If a clear next step is central to the offer or concept, include a CTA; otherwise CTA omission is allowed.
- CTA labels must be specific to the offer and action, not generic.
- Supporting highlights are optional. If used, show them only once in a single lower support cluster beneath the hero.
- Keep the hero dominant, focused, readable, and uncluttered.
- Proof is optional. Use it only if it clearly strengthens the concept.
- If no real proof assets are provided, do not invent metrics, testimonials, customer logos, screenshots, or fake UI proof.
- Prefer depth inside the hero, proof gesture, CTA behavior, support copy, or background logic rather than adding extra sections by default.

## Composition
- Choose the clearest structure for the topic; do not default to generic two-column marketing layouts.
- A top navigation bar is optional. When used, make it native to the chosen style direction and subordinate to the hero rather than a generic boxed header.
- The hero may be fully integrated rather than framed.
- The hero does not need to become a panel, dashboard, device mockup, rounded card, or floating showcase unless the topic genuinely demands that artifact.
- Build hierarchy through scale, contrast, spacing, alignment, depth, rhythm, and composition before using frames, dividers, or containers.
- Keep supporting content clearly subordinate to the hero.
- Do not interpret structural restraint as permission to flatten the concept into a generic minimal layout.
- Do not use text-on-text layering, typographic collisions, or overlapping live text as a compositional device.

## Visual system
- Build one coherent visual world derived from the topic itself.
- Let the topic drive palette, contrast, typography, spacing, geometry, motifs, materials, and motion.
- Even restrained palettes must feel intentional and specific, not generic premium-neutral.
- The background must actively contribute mood, depth, and topic logic.
- If the topic suggests a real system language, physical behavior, or interface grammar, show that directly instead of generic abstract-tech decoration.
- Treat headline typography as part of the concept, not neutral text.
- The headline may use topic-derived color, selective emphasis, multi-tone treatment, or gradient accents when they strengthen the concept and remain readable.
- Do not default the headline to neutral black, white, or near-white unless that is clearly the strongest topic-native choice.

## Background and tonal diversity
- Premium and atmospheric design may be light, mid-tone, or dark; do not default to dark.
- Choose the tonal key from the topic, offer, audience, and style direction rather than from generic cinematic or tech aesthetics.
- Contrast may come from hue, saturation, temperature, texture, density, or scale, not only darkness.

## Proof and concept expression
- Prefer the minimum visual evidence needed to make the idea feel specific, credible, and native to the topic.
- If the concept is strongest with typography, atmosphere, and one precise gesture, do that.
- If a stronger proof artifact is justified, use one legible, unified artifact rather than multiple fragmented panels.
- Proof may take the form of a signal, trace, contour, command line, path, specimen, structural mark, scene fragment, or other topic-native evidence.
- Typography itself may carry part of the concept or proof.
- When appropriate, use one precise typographic gesture—such as selective word emphasis, chromatic offset, gradient emphasis, distortion, signal breakup, or structural interruption—to make the concept feel more specific and alive.
- Prefer one strong typographic intervention over many scattered decorative effects.
- Avoid decorative pseudo-proof.
- Avoid turning simple ideas into framed showcases, dashboard fragments, floating panels, softened slabs, or generic marketing geometry.

## Icons and symbolic language
- Icons are optional.
- Use icons only when they improve scanability, recognition, navigation, proof clarity, or support-cluster legibility.
- Prefer topic-native icon logic over generic startup glyphs.
- Keep icon style consistent in stroke weight, geometry, corner logic, and detail level.
- Use icons primarily in clearly secondary roles unless a single topic-native symbol is central to the concept.
- Do not let icons compete with the hero headline, proof artifact, or CTA hierarchy.

## Support cluster
- If used, show supporting highlights only once, in a single lower cluster beneath the hero.
- Each highlight should be short, fast to scan, and clearly secondary.
- Supporting highlights may use concise icons or symbolic marks when helpful.
- Support-cluster elements may use subtle motion when it improves scanability, continuity, or atmosphere and remains clearly secondary.
- Card-like grouping is allowed only inside this lower support cluster.
- These modules may use at most one light surface treatment, such as a subtle stroke, tonal fill, or very soft shadow.
- Keep support modules uniform, non-nested, and visually subordinate.
- Do not use card-like structures in the hero, proof, CTA area, or elsewhere on the page.

## Motion
- Motion is optional.
- Use motion only when it supports hierarchy, continuity, feedback, atmosphere, or topic logic.
- Default to none, minimal, or ambient motion depending on what the concept actually needs.
- Motion may live in typography, background behavior, proof logic, support-cluster behavior, or interaction feedback.
- A single key word or short phrase may use subtle text-based motion such as glitch, flicker, jitter, scanline shift, chromatic split, text scramble, pulse, or reveal if it strengthens the concept.
- Keep motion controlled, readable, non-blocking, and subordinate to clarity.
- Avoid scrolljacking, attention-hijacking loops, and ornamental animation.
- Respect reduced-motion preferences.

## Accessibility and readability
- Preserve strong readability and clear hierarchy at all viewport sizes.
- Maintain sufficient contrast between text and background.
- Do not place essential text over busy imagery unless readability remains strong.
- Avoid cramped spacing, visual collisions, and weak focal hierarchy.
- Do not place badges, pills, annotations, stickers, or floating interface fragments over essential text.
- If the deliverable is code, use semantic HTML structure, visible focus states, keyboard-friendly interactions, and reduced-motion handling.
- When in doubt, preserve legibility over expressive overlap.

## Anti-drift rules
- Do not drift into bland corporate SaaS styling.
- Do not default to dashboard aesthetics, feature-grid thinking, boxed-section composition, or template-like modularity.
- Do not use disconnected motifs, random color choices, or interchangeable abstract-tech shapes.
- Do not use card-within-card composition, nested surfaces, floating panels, fake proof, or stock-looking UI.
- Keep one visual world, one dominant hero, and one clear structural logic.
- Do not allow text, labels, or interface elements to overlap, collide, or sit on top of one another.

## Output
Return only the final 기존 Spring Boot와 vanilla HTML/CSS/JS 실제 서비스, 홈페이지와 연결된 전체 화면.

If the deliverable is code:
- Output a complete production-ready file or component.
- Keep dependencies minimal unless explicitly requested.
- Make it responsive.
- Keep support highlights in one lower support cluster only when used.

## Final self-check
Before returning, verify that the result keeps:
- one dominant hero
- one coherent visual world
- no invented proof
- no cardification outside the lower support cluster
- no generic SaaS drift
- no unnecessary structural fragmentation
- no nested containment
- no floating sub-surfaces
- all text clearly legible and comfortably spaced

The explicit user-selected reference contract above overrides generic creative discretion: match the measured Npay font stack and catalogue composition. Do not design another new hero, large card grid or different typography.


Explicit current contract: reproduce the measured public Npay layout and component rules across every Ansimlife screen. The earlier font-only implementation is rejected. No creative substitution of giant cards, side marketing panels or black sticky action slabs.

### Output target
- src/main/resources/static/index.html and its existing JS/CSS screen files.

## Earlier plans preserved
<details><summary>Earlier design documentation</summary>
### Previous plan

## 2026-10-28 실행 범위와 실측 근거

사용자는 이전 Wanted Sans·넓은 2열 카드 디자인을 거절하고, 연결한 네이버페이 화면의 디자인과 폰트를 가져와 적용하라고 명시했다. 새로운 창작 방향을 만들지 않고 실제 시각 규칙을 재현한다. 기존 공공 API·키·자동 갱신·라우팅·로그인·저장키·준비·PDF 계약을 유지한다.

- 원본: https://pay.naver.com/benefit/payment/list?firstCategory=ONLINE
- 1440×900 및 390×844에서 실제 DOM computed style과 화면을 확인했다. 측정 기록은 작업 outputs/npay-reference-measurements.json에 보존한다.
- 원본 font-family: -apple-system, BlinkMacSystemFont, helvetica, "Apple SD Gothic Neo", 나눔고딕, NanumGothic, "맑은 고딕", MalgunGothic, sans-serif. 별도 웹폰트가 아니다. 현재 Windows에는 malgun.ttf·malgunbd.ttf가 있고 NanumGothic은 없어 한국어는 맑은 고딕 폴백을 사용한다. 웹에 같은 글꼴 목록을 적용하며 Wanted/Pretendard 강제 지정을 제거한다.
- 원본 본문 14px, 이름 14px/20px/500, 강조 16px/22px/700, 자간 -0.3px, 기본 -0.5px. 상단 탭 18px/24px/700, 칩 15px/21px, 간격 8px.
- 헤더 56px, 탭 40px, PC 바깥 헤더 1080px·콘텐츠 외곽 약 689px·내부 641px, 모바일 좌우 20px. 분야 썸네일 70×70px·반경 6px, 행 간격 14px.
- 원본 구성을 가져오되 실제 공고의 긴 제목과 저장·비교 두 조작을 수용해 행은 최소 96px 이상 자동 높이를 사용한다. 원본보다 긴 내용을 한 글자씩 찢지 않는다. 조작 높이는 44px 이상, 설명 회색과 배지 녹색은 읽기 가능한 대비로 보정한다. 타사 광고·상점 로고·허위 혜택을 복제하지 않는다.

## Variant 1

### Resolved inputs
- Topic: 안심생활의 공공혜택 검색·저장·비교·신청 준비
- Offer: 공식 API 공고와 상세·제출서류·PDF·계정별 준비 기록
- Audience: 전 연령의 한국어 이용자, 모바일 우선
- Primary user action: 검색 또는 상황 선택으로 혜택을 찾고 공식 상세를 확인
- Deliverable: 기존 Spring Boot와 vanilla HTML/CSS/JS 실제 서비스, 홈페이지와 연결된 전체 화면
- Style direction: 실측한 네이버페이 결제혜택의 시스템 글꼴·좁은 1열·평면 목록·상단 밑줄 탭을 직접 재현
- Tonal key: Light, 흰 콘텐츠와 #f3f5f7 외부 바탕, #1e1e23 본문, 짙은 선택 칩
- Icon policy: 기존 안심생활 SVG를 70px 분야 썸네일에 사용, 타사 로고와 이미지는 사용하지 않음
- Proof assets: 실제 API 공고와 조회 시각, 원본 화면의 실제 측정 기록; 가상 성과 없음
- Motion intensity: Minimal, 상태 피드백만 사용하고 reduced-motion 유지

### Composition contract
- Hero archetype: centered, compact search module. 원본의 작은 회색 혜택 배너 자리와 크기에 실제 검색 입력을 배치한다. 대형 제목·일러스트는 없다.
- First-viewport structure: 56px 헤더 → 44px 상단 4개 밑줄 탭 → 회색 검색 모듈(제목과 내 조건 CTA·1행 검색) → 수평 상황 칩 → 결과 제목·정렬·필터 펼침 → 70px 썸네일이 있는 1열 목록. PC도 좁은 중앙 열을 사용하고 모바일 목록의 정보 위계를 동일하게 유지한다.
- Primary visual/proof artifact: 실제 공고의 분야 아이콘, 제목, 지원 요약, 대상, 기한. 과거 2열 테두리 카드를 제거한다.
- Interaction behavior: 기존 searchForm·region·topicList·category·quickFilters를 그대로 연결한다. 제목/행 클릭은 공식 상세, 오른쪽 44px 저장·비교는 독립 조작이다. 기존 준비·계정·PDF 모달과 새로고침을 유지한다.
- Reuse boundary: 기존 공통 JS 상태와 API·저장 계약을 재사용하고 index.html 헤더 구조, app.js 목록 마크업, product.css의 실제 시각 규칙만 변경한다. 4개 화면의 ID·라우팅·폼을 유지한다.

### 메시지와 CTA
- 화면 제목: 내게 필요한 혜택 찾기. 검색 입력과 같은 회색 모듈 안에 16px로 표시한다.
- 주 CTA: 검색 → #searchForm / loadPrograms(). 모바일에서도 44px 검색 아이콘 버튼과 aria-label 유지.
- 보조 CTA: 내 조건 → #diagnosisOpen. 전체 목록·저장 혜택·신청 준비·설정은 원본과 같은 상단 탭으로 이동한다. 중복 하단 메뉴의 기존 ID·이벤트는 호환을 위해 보존하되 표시하지 않는다.

### 구체적 시각·콘텐츠 체계
- 시스템 글꼴 목록과 14/16/18px 계층을 원본과 동일하게 적용한다. 모든 웹 화면·입력·버튼·대화상자에 같은 family를 사용한다. PDF 파일은 기존 임베드 한글 서체와 API 계약을 보존한다.
- 바깥 #f3f5f7, 중앙 #fff, 본문 #1e1e23, 회색 #767678, 선 #ededed, 선택 #242729, 보조 녹색 바탕 #defae4, 읽기용 녹색 #087f3c. 외곽 그림자·그라데이션 없음.
- PC 중앙 689px, 내부 좌우 24px. 모바일 689px 이하 좌우 20px. 헤더만 1080px. 공고·저장 목록은 모든 폭에서 한 열이다.
- 홈의 상황은 아이콘 타일 대신 원본과 같은 수평 둥근 칩이다. 가로 넘침은 칩 영역 내 의도적 스크롤만 허용한다. 검색은 회색 모듈의 짧은 제목과 44px 입력으로 정리한다. 원본처럼 목록을 앞당기기 위해 분야·추가 조건·검색 저장은 결과 제목 오른쪽 필터 펼침으로 모으고 모든 기존 ID·기능을 유지한다.
- 공고 행: 70px 분야 아이콘/기한, 본문(분야·지역 14px → 제목 16px → 지원·대상 14px), 오른쪽 저장·비교 44px. 모바일 긴 제목은 2행, 설명·대상은 미리보기 1행이며 상세에서 전체 내용을 제공한다.
- 저장·준비·설정은 중앙 열의 20px 페이지 제목, 구획 간 24px, 단순한 구분선. 모달 20~24px 제목과 15~16px 본문, 입력 44px 이상. 기존 큰 글씨 설정을 유지한다.
- 실제 아이콘은 기존 SVG, 장식 alt 불필요(aria-hidden). 소관기관 로고를 만들거나 가져오지 않는다. 공공정보가 없는 필드·실패·빈 상태는 기존 정직한 안내를 유지한다.
- 모바일 후원·비교는 일반 흐름, 상단 탭은 작은 화면에서도 고정 접근 가능하게 하고 safe-area를 유지한다. 키보드 포커스와 Escape·포커스 복귀, reduced-motion 유지.

### 수정 경로와 검증
- src/main/resources/static/index.html, app.js, product.css, 필요한 공통 토큰 service.css, README.md.
- build/test: Maven 테스트·패키징, JS 9개 테스트와 구문 검사. 시각 변경용 구현 복제 테스트는 추가하지 않는다.
- 실제 API가 연결된 로컬 서버에서 360×800·390×844·768×1024·1440×900과 큰 글씨, 홈·저장·준비·설정·모달·검색·빈 결과·저장·비교·PDF를 확인한다.
- 원본과 안심생활의 font-family·14/16px 계층·70px 썸네일·중앙 폭을 수치로 비교한다. 실제 스크린샷을 직접 본다.
- 앞선 실제 서비스 적용·배포 요청이 이어지는 수정이다. 검증 뒤 canonical main → 실제 fork 동기화 → 기존 Coders 배포 → 운영 API·정적 파일·4개 뷰포트를 확인한다. 공개 파일·Git 기록에서 비밀값을 검사한다.

### Filled generation prompt
Create one high-concept page for 안심생활의 공공혜택 검색·저장·비교·신청 준비.

## Inputs
- Topic: 안심생활의 공공혜택 검색·저장·비교·신청 준비.
- Offer: 공식 API 공고와 상세·제출서류·PDF·계정별 준비 기록
- Audience: 전 연령의 한국어 이용자, 모바일 우선
- Primary user action: 검색 또는 상황 선택으로 혜택을 찾고 공식 상세를 확인
- Deliverable: 기존 Spring Boot와 vanilla HTML/CSS/JS 실제 서비스, 홈페이지와 연결된 전체 화면
- Style direction: 실측한 네이버페이 결제혜택의 시스템 글꼴·좁은 1열·평면 목록·상단 밑줄 탭을 직접 재현
- Tonal key: Light, 흰 콘텐츠와 #f3f5f7 외부 바탕, #1e1e23 본문, 짙은 선택 칩
- Icon policy: 기존 안심생활 SVG를 70px 분야 썸네일에 사용, 타사 로고와 이미지는 사용하지 않음
- Proof assets: 실제 API 공고와 조회 시각, 원본 화면의 실제 측정 기록; 가상 성과 없음
- Motion intensity: Minimal, 상태 피드백만 사용하고 reduced-motion 유지

## Objective
Design one premium, memorable page with a dominant hero and one coherent visual world derived from the topic itself.
The result should feel specific, intentional, and action-oriented when the concept calls for action, not like a generic startup or SaaS template.

Choose the strongest clear solution.
Do not collapse the concept into a simpler generic pattern just to make execution easier.

- Treat single-file execution as a packaging constraint, not a creative constraint.
Do not reduce conceptual ambition, visual specificity, interaction richness, or production quality merely because the deliverable is concise.

## Internal concept choice
Before composing, decide internally:
- one dominant hero archetype: centered / asymmetrical / immersive
- one dominant proof mode: none / embedded gesture / single artifact
- one palette driver derived from the topic
- one tonal key: light / mid / dark / topic-derived
- one motion role: none / minimal / ambient / interactive
- one icon approach: none / minimal / expressive / topic-native
- optionally one secondary accent only if it strengthens the main direction without creating a second visual world
Do not output this planning.

## Non-negotiables
- Use a strong hero-first composition.
- Headline: 3-12 words, max 3 lines.
- Supporting copy: 1-2 short sentences, concise and specific.
- CTAs are optional. If used, include at most 1 primary and 1 secondary CTA.
- If a clear next step is central to the offer or concept, include a CTA; otherwise CTA omission is allowed.
- CTA labels must be specific to the offer and action, not generic.
- Supporting highlights are optional. If used, show them only once in a single lower support cluster beneath the hero.
- Keep the hero dominant, focused, readable, and uncluttered.
- Proof is optional. Use it only if it clearly strengthens the concept.
- If no real proof assets are provided, do not invent metrics, testimonials, customer logos, screenshots, or fake UI proof.
- Prefer depth inside the hero, proof gesture, CTA behavior, support copy, or background logic rather than adding extra sections by default.

## Composition
- Choose the clearest structure for the topic; do not default to generic two-column marketing layouts.
- A top navigation bar is optional. When used, make it native to the chosen style direction and subordinate to the hero rather than a generic boxed header.
- The hero may be fully integrated rather than framed.
- The hero does not need to become a panel, dashboard, device mockup, rounded card, or floating showcase unless the topic genuinely demands that artifact.
- Build hierarchy through scale, contrast, spacing, alignment, depth, rhythm, and composition before using frames, dividers, or containers.
- Keep supporting content clearly subordinate to the hero.
- Do not interpret structural restraint as permission to flatten the concept into a generic minimal layout.
- Do not use text-on-text layering, typographic collisions, or overlapping live text as a compositional device.

## Visual system
- Build one coherent visual world derived from the topic itself.
- Let the topic drive palette, contrast, typography, spacing, geometry, motifs, materials, and motion.
- Even restrained palettes must feel intentional and specific, not generic premium-neutral.
- The background must actively contribute mood, depth, and topic logic.
- If the topic suggests a real system language, physical behavior, or interface grammar, show that directly instead of generic abstract-tech decoration.
- Treat headline typography as part of the concept, not neutral text.
- The headline may use topic-derived color, selective emphasis, multi-tone treatment, or gradient accents when they strengthen the concept and remain readable.
- Do not default the headline to neutral black, white, or near-white unless that is clearly the strongest topic-native choice.

## Background and tonal diversity
- Premium and atmospheric design may be light, mid-tone, or dark; do not default to dark.
- Choose the tonal key from the topic, offer, audience, and style direction rather than from generic cinematic or tech aesthetics.
- Contrast may come from hue, saturation, temperature, texture, density, or scale, not only darkness.

## Proof and concept expression
- Prefer the minimum visual evidence needed to make the idea feel specific, credible, and native to the topic.
- If the concept is strongest with typography, atmosphere, and one precise gesture, do that.
- If a stronger proof artifact is justified, use one legible, unified artifact rather than multiple fragmented panels.
- Proof may take the form of a signal, trace, contour, command line, path, specimen, structural mark, scene fragment, or other topic-native evidence.
- Typography itself may carry part of the concept or proof.
- When appropriate, use one precise typographic gesture—such as selective word emphasis, chromatic offset, gradient emphasis, distortion, signal breakup, or structural interruption—to make the concept feel more specific and alive.
- Prefer one strong typographic intervention over many scattered decorative effects.
- Avoid decorative pseudo-proof.
- Avoid turning simple ideas into framed showcases, dashboard fragments, floating panels, softened slabs, or generic marketing geometry.

## Icons and symbolic language
- Icons are optional.
- Use icons only when they improve scanability, recognition, navigation, proof clarity, or support-cluster legibility.
- Prefer topic-native icon logic over generic startup glyphs.
- Keep icon style consistent in stroke weight, geometry, corner logic, and detail level.
- Use icons primarily in clearly secondary roles unless a single topic-native symbol is central to the concept.
- Do not let icons compete with the hero headline, proof artifact, or CTA hierarchy.

## Support cluster
- If used, show supporting highlights only once, in a single lower cluster beneath the hero.
- Each highlight should be short, fast to scan, and clearly secondary.
- Supporting highlights may use concise icons or symbolic marks when helpful.
- Support-cluster elements may use subtle motion when it improves scanability, continuity, or atmosphere and remains clearly secondary.
- Card-like grouping is allowed only inside this lower support cluster.
- These modules may use at most one light surface treatment, such as a subtle stroke, tonal fill, or very soft shadow.
- Keep support modules uniform, non-nested, and visually subordinate.
- Do not use card-like structures in the hero, proof, CTA area, or elsewhere on the page.

## Motion
- Motion is optional.
- Use motion only when it supports hierarchy, continuity, feedback, atmosphere, or topic logic.
- Default to none, minimal, or ambient motion depending on what the concept actually needs.
- Motion may live in typography, background behavior, proof logic, support-cluster behavior, or interaction feedback.
- A single key word or short phrase may use subtle text-based motion such as glitch, flicker, jitter, scanline shift, chromatic split, text scramble, pulse, or reveal if it strengthens the concept.
- Keep motion controlled, readable, non-blocking, and subordinate to clarity.
- Avoid scrolljacking, attention-hijacking loops, and ornamental animation.
- Respect reduced-motion preferences.

## Accessibility and readability
- Preserve strong readability and clear hierarchy at all viewport sizes.
- Maintain sufficient contrast between text and background.
- Do not place essential text over busy imagery unless readability remains strong.
- Avoid cramped spacing, visual collisions, and weak focal hierarchy.
- Do not place badges, pills, annotations, stickers, or floating interface fragments over essential text.
- If the deliverable is code, use semantic HTML structure, visible focus states, keyboard-friendly interactions, and reduced-motion handling.
- When in doubt, preserve legibility over expressive overlap.

## Anti-drift rules
- Do not drift into bland corporate SaaS styling.
- Do not default to dashboard aesthetics, feature-grid thinking, boxed-section composition, or template-like modularity.
- Do not use disconnected motifs, random color choices, or interchangeable abstract-tech shapes.
- Do not use card-within-card composition, nested surfaces, floating panels, fake proof, or stock-looking UI.
- Keep one visual world, one dominant hero, and one clear structural logic.
- Do not allow text, labels, or interface elements to overlap, collide, or sit on top of one another.

## Output
Return only the final 기존 Spring Boot와 vanilla HTML/CSS/JS 실제 서비스, 홈페이지와 연결된 전체 화면.

If the deliverable is code:
- Output a complete production-ready file or component.
- Keep dependencies minimal unless explicitly requested.
- Make it responsive.
- Keep support highlights in one lower support cluster only when used.

## Final self-check
Before returning, verify that the result keeps:
- one dominant hero
- one coherent visual world
- no invented proof
- no cardification outside the lower support cluster
- no generic SaaS drift
- no unnecessary structural fragmentation
- no nested containment
- no floating sub-surfaces
- all text clearly legible and comfortably spaced

The explicit user-selected reference contract above overrides generic creative discretion: match the measured Npay font stack and catalogue composition. Do not design another new hero, large card grid or different typography.

### Output target
- Path: src/main/resources/static/index.html, app.js, product.css and the existing connected screen files.

## Earlier design documentation (preserved)
<details>
<summary>Previous design plans</summary>

### Previous OpenUI Design Plan

## 2026-10-27 현재 실행 범위

사용자는 기존 큰 제목·폴더 그림·넓은 단일 목록을 거절하고, 실제 운영 중인 서비스의 구성을 기준으로 디자인을 다시 만들 것을 요청했다. 공공데이터 키도 연결해 자동 갱신과 공식 상세 조회를 활성화한다. 기존 스택·로그인·검색·저장·비교·준비 기록·공식 링크·PDF 계약을 보존한다.

### 조사 근거와 방향
- 주 참고: https://pay.naver.com/benefit/payment/list?firstCategory=ONLINE — 실제 화면에서 짧은 제목, 단순한 탭, 명확한 혜택 정보와 기한, 절제된 표면을 확인했다.
- 보조 참고: https://www.welfarehello.com/ — 분야 바로가기와 정책 탐색을 확인했다. 아티클·기부·광고·커뮤니티는 안심생활의 현재 기능이 아니므로 추가하지 않는다.
- 현재 코드 문제: `index.html`의 hero-intro와 benefit-guide.svg가 실제 목록을 뒤로 밀고, `product.css`의 넓은 1열 카드가 한 화면에서 확인할 수 있는 공고를 줄인다. 여러 CSS 세대가 겹쳐 역할별 위계가 흐리다.
- 타사 로고·상표·본문·그림·앱 자산은 가져오지 않는다. 관찰한 검색·탭·목록의 공통 구조와 간격을 안심생활의 실제 데이터와 자체 아이콘으로 구현한다.

## Variant 1

### Resolved inputs
- Topic: 정부·지자체 혜택을 찾고 공식 정보를 확인하는 안심생활
- Offer: 공식 공고 검색, 상황별 탐색, 관심 저장, 비교, 신청 준비와 PDF 안내
- Audience: 한국어를 사용하는 전 연령의 모바일·PC 이용자
- Primary user action: 키워드와 지역으로 혜택을 검색하고 실제 지원 대상·기간·서류를 확인
- Deliverable: 기존 Spring Boot와 vanilla HTML/CSS/JavaScript의 실제 서비스 4개 화면 및 연결된 대화상자
- Style direction: 네이버페이 결제혜택의 간결한 탐색과 정보 위계를 따른 한국어 소비자 서비스 카탈로그
- Tonal key: Light: 흰 바탕, 짙은 본문, 녹색 핵심 행동과 옅은 회색 구획
- Icon policy: 기존 자체 SVG 선 아이콘을 일관되게 사용
- Proof assets: 실제 공공서비스 API의 목록·상세·갱신 시각; 이용자 수·성과·리뷰를 만들지 않음
- Motion intensity: Minimal: 상태 변화와 조작 피드백만, reduced-motion 존중

### Composition contract
- Hero archetype: centered, typography-led 검색 도입. 장식용 사진·일러스트 없이 실제 검색 폼이 중심이다.
- First-viewport structure: 72px 흰 헤더 → 32px 한 줄 제목과 짧은 설명 → 68px 검색 폼 → 6개 상황 바로가기 → 결과 제목·탭과 첫 혜택 행. 모바일은 64px 헤더, 28px 두 줄 이하 제목, 2행 검색, 3열×2행 바로가기, 1열 목록이다.
- Primary visual/proof artifact: API에서 받은 실제 공고 제목·지원 요약·대상·기한. 가상 사용자 수나 홍보용 숫자 없음.
- Interaction behavior: searchForm 제출·region 변경·topicList 선택은 기존 API 검색을 호출한다. 상세에서 조건·서류·출처·조회 시각을 확인하고 공식 접수처로 이동한다. 최신 정보 다시 조회는 읽기 전용 API로 연결한다.
- Reuse boundary: 기존 JS 상태·API·저장키·라우팅·폼·모달 구조를 유지한다. index.html의 검색 도입과 product.css의 공통 화면 체계를 수정한다. 메인 검색 form·메뉴·대화상자의 id 계약을 바꾸지 않는다.

### 메시지와 실제 행동
- 핵심 메시지: 내게 필요한 혜택을 찾아보세요.
- 본문: 정부·지자체 지원부터 신청 준비까지, 필요한 정보를 한곳에서.
- 주 CTA: 혜택 검색 → 기존 #searchForm / loadPrograms().
- 보조 CTA: 내 조건으로 찾기 → #diagnosisOpen / 기존 맞춤 조건 대화상자.
- 목록 제목을 클릭하면 openBenefitDetail(id), 저장·비교는 기존 data-action, 준비는 기존 계정별 기록 흐름을 따른다.

### 구체적 시각 체계
- 최대 콘텐츠 폭 1120px, PC 좌우 최소 32px, 모바일 20px. 8px 기준 간격 체계: 8·12·16·24·32·48.
- 바탕 #ffffff, 보조 바탕 #f6f8f7, 본문 #202725, 보조 #66726d, 선 #e3e9e6.
- 주요 행동 #007f5f, hover #006b50, 옅은 녹색 #eaf5ef. 선택 탭은 #252b28 바탕에 흰 글씨. 경고 #94631c, 오류 #b93d3d.
- 로컬 Wanted Sans → Pretendard Variable → 시스템 sans-serif. 본문 18px/1.7/400, 조작 16px/1.5/550, 보조 14~15px/1.6/400, 목록 제목 20px/1.5/650, 화면 제목 32px/1.4/700, 모바일 제목 28px/1.45/700. 한국어 keep-all과 긴 URL anywhere, 숫자 tabular.
- 기본 카드 12px 반경·1px 선, 입력 10px 반경, 모달 16px 반경. 불필요한 그림자·그라데이션·hover 이동 없음.
- PC 혜택 목록 2열, 중간 폭에서 2열, 700px 이하 1열. 타이틀와 내용은 축소하지 않고 필요한 높이를 사용한다. 본문 큰 글씨 설정 유지.
- 상황 바로가기는 PC 6열, 모바일 3열×2행. 아이콘 24px, 최소 조작 높이 72px. 첫 화면에서 필수 상황을 숨기지 않는다.
- 저장·준비·설정·로그인·맞춤·비교·상세·안내문에 동일한 서체·색·입력·버튼·간격을 적용한다. 준비·설정의 고정 비교 숨김과 모바일 후원 영역의 footer 배치를 보존한다.

### 공공데이터 계약
- 공식 API: https://www.data.go.kr/data/15113968/openapi.do / gov24 v3 serviceList·serviceDetail.
- 비공개 .env에서 사용자가 제공한 키를 검증한 뒤 Coders의 secret 환경변수 DATA_GO_KR_SERVICE_KEY에 등록했다. 키는 문서·Git·로그·URL에 기록하지 않는다.
- 운영 재기동 후 자동 목록 동기화와 매일 04:20 Asia/Seoul 갱신을 확인한다. 상세의 실제 조회 시각과 캐시 사용 여부를 표시하고 명시적인 다시 조회를 제공한다. 공식 신청·자격 확정으로 표현하지 않는다.
- 외부 오류일 때 기존 공고를 보존하고 저장 정보라는 상태를 보여준다. 통신 오류를 최신 조회 성공으로 표현하지 않는다.

### 수정 경로와 검증
- src/main/resources/static/index.html, product.css, product.js, app.js; 필요한 상세 조회 Java 서비스·컨트롤러와 테스트; README.md.
- 기존 API 응답 필드는 유지하고 조회 시각 등의 정보는 선택 필드로 추가한다. 기존 로그인과 저장 데이터 계약을 보존한다.
- Maven 테스트·패키징, JS 테스트·문법 검증, 실제 API 목록·상세 응답, 로컬과 운영의 360×800·390×844·768×1024·1440×900 화면을 확인한다.
- 검색·분야·빈 결과·저장·정렬·준비·모달·최신 상세·PDF·포커스 복귀·콘솔 오류를 확인한다. 원본 push → 실제 fork 동기화 → 기존 Coders 프로젝트 배포 → 운영 검증 순서를 따른다.

### Filled generation prompt
Create one high-concept page for 정부·지자체 혜택을 찾고 공식 정보를 확인하는 안심생활.

## Inputs
- Topic: 정부·지자체 혜택을 찾고 공식 정보를 확인하는 안심생활.
- Offer: 공식 공고 검색, 상황별 탐색, 관심 저장, 비교, 신청 준비와 PDF 안내
- Audience: 한국어를 사용하는 전 연령의 모바일·PC 이용자
- Primary user action: 키워드와 지역으로 혜택을 검색하고 실제 지원 대상·기간·서류를 확인
- Deliverable: 기존 Spring Boot와 vanilla HTML/CSS/JavaScript의 실제 서비스 4개 화면 및 연결된 대화상자
- Style direction: 네이버페이 결제혜택의 간결한 탐색과 정보 위계를 따른 한국어 소비자 서비스 카탈로그
- Tonal key: Light: 흰 바탕, 짙은 본문, 녹색 핵심 행동과 옅은 회색 구획
- Icon policy: 기존 자체 SVG 선 아이콘을 일관되게 사용
- Proof assets: 실제 공공서비스 API의 목록·상세·갱신 시각; 이용자 수·성과·리뷰를 만들지 않음
- Motion intensity: Minimal: 상태 변화와 조작 피드백만, reduced-motion 존중

## Objective
Design one premium, memorable page with a dominant hero and one coherent visual world derived from the topic itself.
The result should feel specific, intentional, and action-oriented when the concept calls for action, not like a generic startup or SaaS template.

Choose the strongest clear solution.
Do not collapse the concept into a simpler generic pattern just to make execution easier.

- Treat single-file execution as a packaging constraint, not a creative constraint.
Do not reduce conceptual ambition, visual specificity, interaction richness, or production quality merely because the deliverable is concise.

## Internal concept choice
Before composing, decide internally:
- one dominant hero archetype: centered / asymmetrical / immersive
- one dominant proof mode: none / embedded gesture / single artifact
- one palette driver derived from the topic
- one tonal key: light / mid / dark / topic-derived
- one motion role: none / minimal / ambient / interactive
- one icon approach: none / minimal / expressive / topic-native
- optionally one secondary accent only if it strengthens the main direction without creating a second visual world
Do not output this planning.

## Non-negotiables
- Use a strong hero-first composition.
- Headline: 3-12 words, max 3 lines.
- Supporting copy: 1-2 short sentences, concise and specific.
- CTAs are optional. If used, include at most 1 primary and 1 secondary CTA.
- If a clear next step is central to the offer or concept, include a CTA; otherwise CTA omission is allowed.
- CTA labels must be specific to the offer and action, not generic.
- Supporting highlights are optional. If used, show them only once in a single lower support cluster beneath the hero.
- Keep the hero dominant, focused, readable, and uncluttered.
- Proof is optional. Use it only if it clearly strengthens the concept.
- If no real proof assets are provided, do not invent metrics, testimonials, customer logos, screenshots, or fake UI proof.
- Prefer depth inside the hero, proof gesture, CTA behavior, support copy, or background logic rather than adding extra sections by default.

## Composition
- Choose the clearest structure for the topic; do not default to generic two-column marketing layouts.
- A top navigation bar is optional. When used, make it native to the chosen style direction and subordinate to the hero rather than a generic boxed header.
- The hero may be fully integrated rather than framed.
- The hero does not need to become a panel, dashboard, device mockup, rounded card, or floating showcase unless the topic genuinely demands that artifact.
- Build hierarchy through scale, contrast, spacing, alignment, depth, rhythm, and composition before using frames, dividers, or containers.
- Keep supporting content clearly subordinate to the hero.
- Do not interpret structural restraint as permission to flatten the concept into a generic minimal layout.
- Do not use text-on-text layering, typographic collisions, or overlapping live text as a compositional device.

## Visual system
- Build one coherent visual world derived from the topic itself.
- Let the topic drive palette, contrast, typography, spacing, geometry, motifs, materials, and motion.
- Even restrained palettes must feel intentional and specific, not generic premium-neutral.
- The background must actively contribute mood, depth, and topic logic.
- If the topic suggests a real system language, physical behavior, or interface grammar, show that directly instead of generic abstract-tech decoration.
- Treat headline typography as part of the concept, not neutral text.
- The headline may use topic-derived color, selective emphasis, multi-tone treatment, or gradient accents when they strengthen the concept and remain readable.
- Do not default the headline to neutral black, white, or near-white unless that is clearly the strongest topic-native choice.

## Background and tonal diversity
- Premium and atmospheric design may be light, mid-tone, or dark; do not default to dark.
- Choose the tonal key from the topic, offer, audience, and style direction rather than from generic cinematic or tech aesthetics.
- Contrast may come from hue, saturation, temperature, texture, density, or scale, not only darkness.

## Proof and concept expression
- Prefer the minimum visual evidence needed to make the idea feel specific, credible, and native to the topic.
- If the concept is strongest with typography, atmosphere, and one precise gesture, do that.
- If a stronger proof artifact is justified, use one legible, unified artifact rather than multiple fragmented panels.
- Proof may take the form of a signal, trace, contour, command line, path, specimen, structural mark, scene fragment, or other topic-native evidence.
- Typography itself may carry part of the concept or proof.
- When appropriate, use one precise typographic gesture—such as selective word emphasis, chromatic offset, gradient emphasis, distortion, signal breakup, or structural interruption—to make the concept feel more specific and alive.
- Prefer one strong typographic intervention over many scattered decorative effects.
- Avoid decorative pseudo-proof.
- Avoid turning simple ideas into framed showcases, dashboard fragments, floating panels, softened slabs, or generic marketing geometry.

## Icons and symbolic language
- Icons are optional.
- Use icons only when they improve scanability, recognition, navigation, proof clarity, or support-cluster legibility.
- Prefer topic-native icon logic over generic startup glyphs.
- Keep icon style consistent in stroke weight, geometry, corner logic, and detail level.
- Use icons primarily in clearly secondary roles unless a single topic-native symbol is central to the concept.
- Do not let icons compete with the hero headline, proof artifact, or CTA hierarchy.

## Support cluster
- If used, show supporting highlights only once, in a single lower cluster beneath the hero.
- Each highlight should be short, fast to scan, and clearly secondary.
- Supporting highlights may use concise icons or symbolic marks when helpful.
- Support-cluster elements may use subtle motion when it improves scanability, continuity, or atmosphere and remains clearly secondary.
- Card-like grouping is allowed only inside this lower support cluster.
- These modules may use at most one light surface treatment, such as a subtle stroke, tonal fill, or very soft shadow.
- Keep support modules uniform, non-nested, and visually subordinate.
- Do not use card-like structures in the hero, proof, CTA area, or elsewhere on the page.

## Motion
- Motion is optional.
- Use motion only when it supports hierarchy, continuity, feedback, atmosphere, or topic logic.
- Default to none, minimal, or ambient motion depending on what the concept actually needs.
- Motion may live in typography, background behavior, proof logic, support-cluster behavior, or interaction feedback.
- A single key word or short phrase may use subtle text-based motion such as glitch, flicker, jitter, scanline shift, chromatic split, text scramble, pulse, or reveal if it strengthens the concept.
- Keep motion controlled, readable, non-blocking, and subordinate to clarity.
- Avoid scrolljacking, attention-hijacking loops, and ornamental animation.
- Respect reduced-motion preferences.

## Accessibility and readability
- Preserve strong readability and clear hierarchy at all viewport sizes.
- Maintain sufficient contrast between text and background.
- Do not place essential text over busy imagery unless readability remains strong.
- Avoid cramped spacing, visual collisions, and weak focal hierarchy.
- Do not place badges, pills, annotations, stickers, or floating interface fragments over essential text.
- If the deliverable is code, use semantic HTML structure, visible focus states, keyboard-friendly interactions, and reduced-motion handling.
- When in doubt, preserve legibility over expressive overlap.

## Anti-drift rules
- Do not drift into bland corporate SaaS styling.
- Do not default to dashboard aesthetics, feature-grid thinking, boxed-section composition, or template-like modularity.
- Do not use disconnected motifs, random color choices, or interchangeable abstract-tech shapes.
- Do not use card-within-card composition, nested surfaces, floating panels, fake proof, or stock-looking UI.
- Keep one visual world, one dominant hero, and one clear structural logic.
- Do not allow text, labels, or interface elements to overlap, collide, or sit on top of one another.

## Output
Return only the final 기존 Spring Boot와 vanilla HTML/CSS/JavaScript의 실제 서비스 4개 화면 및 연결된 대화상자.

If the deliverable is code:
- Output a complete production-ready file or component.
- Keep dependencies minimal unless explicitly requested.
- Make it responsive.
- Keep support highlights in one lower support cluster only when used.

## Final self-check
Before returning, verify that the result keeps:
- one dominant hero
- one coherent visual world
- no invented proof
- no cardification outside the lower support cluster
- no generic SaaS drift
- no unnecessary structural fragmentation
- no nested containment
- no floating sub-surfaces
- all text clearly legible and comfortably spaced

### Output target
- Path: src/main/resources/static/index.html, product.css, product.js, app.js 및 연결된 Java API

<details>
<summary>이전 디자인 기록 — 현재 실행 대상에서 제외</summary>

### OpenUI Design Plan

#### Variant 1

##### Resolved inputs
- Topic: 안심생활 공공혜택 탐색과 신청 준비 관리
- Offer: 같은 검색을 다시 쓰고, 준비 상태와 다음 확인일을 정리하는 생활 도구
- Audience: 지원사업을 탐색하고 여러 혜택의 신청 준비를 이어가는 사용자
- Primary user action: 필요한 혜택 검색 및 저장한 조건으로 다시 검색
- Deliverable: 기존 Spring Boot 정적 HTML/CSS/JavaScript 화면 개선 1개
- Style direction: 현재 녹색 브랜드와 Pretendard, 읽기 쉬운 한국어 정보 위계 유지
- Tonal key: Light
- Icon policy: 기존 SVG 스프라이트의 검색·저장·시계·목록 아이콘 재사용
- Proof assets: 공공데이터 API와 사용자가 직접 저장한 기록. 가상 수치·후기 없음
- Motion intensity: Minimal; reduced-motion에서 부드러운 스크롤과 전환 생략

##### Composition contract
- Hero archetype: asymmetrical. 현재 혜택 봉투 일러스트와 검색 CTA 유지
- First-viewport structure: 기존 제목·진단 CTA 다음 검색 폼과 검색 조건 저장 기능을 배치. 긴 소개나 새 홍보 구획 추가 없음
- Primary visual/proof artifact: 실제 검색 결과, 준비 기록 및 사용자가 정한 다음 확인일
- Interaction behavior: 검색 조건 저장·재적용·삭제, 일반 검색 링크 공유, 준비 현황별 필터·제목 검색·정렬, 다음 확인일 ICS 파일 다운로드
- Reuse boundary: 헤더·모달·API·인증·브랜드·기존 카드 재사용. 신규 개인 관리 UI는 검색과 기록 영역 안에만 배치

##### 목적과 현재 문제
README와 app.js에 검색, 관심 목록, 준비 체크, 사용자 진행기록이 이미 구현되어 있다. 검색 조건 재사용 기능이 없어 동일한 필터를 반복 입력한다. renderApplications는 모든 기록을 단순 나열하여 보완·확인일이 있는 항목을 찾기 어렵다. 다음 확인일은 텍스트로만 표시되어 달력으로 가져갈 수 없다. 상세와 준비 화면의 비동기 응답, 저장 실패와 만료된 로그인, 부분 체크의 기기 간 복원을 함께 점검한다.

##### 메시지와 CTA
- 기존 첫 화면: ‘찾아보면 있어요. 지금 나에게 필요한 혜택.’ / ‘내 조건으로 찾아보기’ → openDiagnosis
- 검색 영역: ‘자주 찾는 조건을 저장해두세요’ / ‘검색 조건 저장’ → 현재 검색 상태를 이 브라우저에 저장(최대 6개)
- 보조 CTA: ‘검색 링크 공유’ → 개인정보 없는 일반 검색 조건의 링크 복사. 맞춤 조건은 링크에 포함하지 않음
- 준비 영역: ‘내 준비 현황’ / ‘일정 다운로드’ → 사용자가 입력한 다음 확인일을 ICS 파일로 내보내기. 기관 마감일이나 알림 전송을 가장하지 않음

##### 시각 기준
- 기존 --green #14765b, --green-soft, --ink, --muted, --line 토큰을 우선 재사용. 상태 강조는 녹색(진행), #a65d15(확인 필요), 중립 회색(완료)
- Pretendard Variable, system-ui, sans-serif. 본문 15px/1.65, 설명 13px/1.6, 제목 24px/1.35 weight650, 컨트롤 14px weight550
- 콘텐츠 폭 현재 1160px 유지. 신규 구획 안 여백 20~24px, 요소 간격 8/12/16/24px. 테두리 1px, 반경 10~12px
- 제목·도구·리스트를 일관되게 왼쪽 정렬. 준비 요약은 실제 기록 수를 쓰며 빈 상태에는 다음 행동 표시
- 모바일 360/390px: 도구는 줄바꿈, 입력은 전체 폭, 버튼 최소44px, 필터는 의도적으로 가로 스크롤. 768px에서 2열, 1440px에서 충분한 여백. min-width:0과 keep-all/overflow-wrap 적용

##### 콘텐츠·동작
1. 검색 폼 아래 저장 조건 바: 저장·공유 버튼, 최대6개 조건과 개별 삭제. 결과 수를 가짜로 예측하지 않는다.
2. 내 준비 현황: 전체/준비/결과대기/보완/완료 필터, 제목 검색, 최근 변경/확인일순 정렬, 오늘까지·7일 이내 요약. 로그인 실패/빈 결과 구분.
3. 일정 다운로드: 다음 확인일이 있는 진행 중 기록을 종일 일정 ICS로 내보냄. 메모·접수번호는 파일에 포함하지 않으며 자동 알림이 아닌 캘린더 가져오기임을 명시.
4. 기존 저장·상세·신청준비·로그인 실패 처리 개선. 공식 제출은 기존 외부 기관 경로 유지.

##### 자산과 접근성
새 외부 이미지 없음. 기존 자산만 재사용한다. 텍스트가 있는 아이콘은 aria-hidden. 입력 레이블, 필터 aria-pressed, 결과 aria-live, 키보드 포커스, 로딩·오류·빈 상태와 재시도 유지. 사용자 기록 삭제는 명시적인 삭제 조작으로만 수행.

##### 수정 경로와 계약
- src/main/resources/static/index.html, app.css, workspace.css: 신규 도구와 반응형 레이아웃
- src/main/resources/static/workflow-core.js: 검색 정규화·일정 분류·ICS 생성의 순수 함수
- src/main/resources/static/workspace.js: 검색 저장/공유와 준비 현황 조작
- src/main/resources/static/app.js: 기존 흐름 연결과 구체적 오류 수정
- Java application/account/support 및 관련 테스트: 검증된 데이터 무결성 문제와 부분 체크 저장 보완
- API는 하위 호환을 유지한다. 기존 개인정보 미수집 원칙 유지. 커밋·푸시·배포는 이번 작업 범위가 아님

##### 검증 계획
변경된 핵심 순수 로직을 Node 내장 test로 검증하고 Java 테스트·패키징 수행. 로컬 서버에서 검색 조건 저장/복원/공유, 로그인→부분 체크 저장→재로그인 복원, 준비 필터와 일정 파일, 빠른 상세 이동/오류 회복 확인. 360×800, 390×844, 768×1024, 1440×900 화면과 넘침·콘솔·키보드 동작을 직접 확인한다.

##### Filled generation prompt
Create one high-concept page for 안심생활의 공공혜택 탐색과 개인 신청 준비 관리.

#### Inputs
- Topic: 안심생활의 공공혜택 탐색과 개인 신청 준비 관리.
- Offer: 공식 혜택 검색, 검색 조건 재사용, 준비 단계와 다음 확인일 관리
- Audience: 필요한 공공혜택을 찾고 여러 신청 준비를 이어가는 대한민국 생활자
- Primary user action: 현재 상황에 맞는 혜택을 검색하고 다음 방문에도 같은 조건으로 이어가기
- Deliverable: 기존 Spring Boot 정적 HTML/CSS/JavaScript 화면의 기능 개선
- Style direction: 기존 안심생활의 녹색과 여유 있는 한글 정보 위계를 유지하는 실용적인 생활 서비스
- Tonal key: Light
- Icon policy: Minimal, 기존 SVG 스프라이트 재사용
- Proof assets: 기존 API의 실제 혜택과 사용자 자신의 준비 기록만 사용; 가상 지표 없음
- Motion intensity: Minimal, 버튼·상태 피드백만 사용하고 reduced-motion 존중

#### Objective
Design one premium, memorable page with a dominant hero and one coherent visual world derived from the topic itself.
The result should feel specific, intentional, and action-oriented when the concept calls for action, not like a generic startup or SaaS template.

Choose the strongest clear solution.
Do not collapse the concept into a simpler generic pattern just to make execution easier.

- Treat single-file execution as a packaging constraint, not a creative constraint.
Do not reduce conceptual ambition, visual specificity, interaction richness, or production quality merely because the deliverable is concise.

#### Internal concept choice
Before composing, decide internally:
- one dominant hero archetype: centered / asymmetrical / immersive
- one dominant proof mode: none / embedded gesture / single artifact
- one palette driver derived from the topic
- one tonal key: light / mid / dark / topic-derived
- one motion role: none / minimal / ambient / interactive
- one icon approach: none / minimal / expressive / topic-native
- optionally one secondary accent only if it strengthens the main direction without creating a second visual world
Do not output this planning.

#### Non-negotiables
- Use a strong hero-first composition.
- Headline: 3-12 words, max 3 lines.
- Supporting copy: 1-2 short sentences, concise and specific.
- CTAs are optional. If used, include at most 1 primary and 1 secondary CTA.
- If a clear next step is central to the offer or concept, include a CTA; otherwise CTA omission is allowed.
- CTA labels must be specific to the offer and action, not generic.
- Supporting highlights are optional. If used, show them only once in a single lower support cluster beneath the hero.
- Keep the hero dominant, focused, readable, and uncluttered.
- Proof is optional. Use it only if it clearly strengthens the concept.
- If no real proof assets are provided, do not invent metrics, testimonials, customer logos, screenshots, or fake UI proof.
- Prefer depth inside the hero, proof gesture, CTA behavior, support copy, or background logic rather than adding extra sections by default.

#### Composition
- Choose the clearest structure for the topic; do not default to generic two-column marketing layouts.
- A top navigation bar is optional. When used, make it native to the chosen style direction and subordinate to the hero rather than a generic boxed header.
- The hero may be fully integrated rather than framed.
- The hero does not need to become a panel, dashboard, device mockup, rounded card, or floating showcase unless the topic genuinely demands that artifact.
- Build hierarchy through scale, contrast, spacing, alignment, depth, rhythm, and composition before using frames, dividers, or containers.
- Keep supporting content clearly subordinate to the hero.
- Do not interpret structural restraint as permission to flatten the concept into a generic minimal layout.
- Do not use text-on-text layering, typographic collisions, or overlapping live text as a compositional device.

#### Visual system
- Build one coherent visual world derived from the topic itself.
- Let the topic drive palette, contrast, typography, spacing, geometry, motifs, materials, and motion.
- Even restrained palettes must feel intentional and specific, not generic premium-neutral.
- The background must actively contribute mood, depth, and topic logic.
- If the topic suggests a real system language, physical behavior, or interface grammar, show that directly instead of generic abstract-tech decoration.
- Treat headline typography as part of the concept, not neutral text.
- The headline may use topic-derived color, selective emphasis, multi-tone treatment, or gradient accents when they strengthen the concept and remain readable.
- Do not default the headline to neutral black, white, or near-white unless that is clearly the strongest topic-native choice.

#### Background and tonal diversity
- Premium and atmospheric design may be light, mid-tone, or dark; do not default to dark.
- Choose the tonal key from the topic, offer, audience, and style direction rather than from generic cinematic or tech aesthetics.
- Contrast may come from hue, saturation, temperature, texture, density, or scale, not only darkness.

#### Proof and concept expression
- Prefer the minimum visual evidence needed to make the idea feel specific, credible, and native to the topic.
- If the concept is strongest with typography, atmosphere, and one precise gesture, do that.
- If a stronger proof artifact is justified, use one legible, unified artifact rather than multiple fragmented panels.
- Proof may take the form of a signal, trace, contour, command line, path, specimen, structural mark, scene fragment, or other topic-native evidence.
- Typography itself may carry part of the concept or proof.
- When appropriate, use one precise typographic gesture—such as selective word emphasis, chromatic offset, gradient emphasis, distortion, signal breakup, or structural interruption—to make the concept feel more specific and alive.
- Prefer one strong typographic intervention over many scattered decorative effects.
- Avoid decorative pseudo-proof.
- Avoid turning simple ideas into framed showcases, dashboard fragments, floating panels, softened slabs, or generic marketing geometry.

#### Icons and symbolic language
- Icons are optional.
- Use icons only when they improve scanability, recognition, navigation, proof clarity, or support-cluster legibility.
- Prefer topic-native icon logic over generic startup glyphs.
- Keep icon style consistent in stroke weight, geometry, corner logic, and detail level.
- Use icons primarily in clearly secondary roles unless a single topic-native symbol is central to the concept.
- Do not let icons compete with the hero headline, proof artifact, or CTA hierarchy.

#### Support cluster
- If used, show supporting highlights only once, in a single lower cluster beneath the hero.
- Each highlight should be short, fast to scan, and clearly secondary.
- Supporting highlights may use concise icons or symbolic marks when helpful.
- Support-cluster elements may use subtle motion when it improves scanability, continuity, or atmosphere and remains clearly secondary.
- Card-like grouping is allowed only inside this lower support cluster.
- These modules may use at most one light surface treatment, such as a subtle stroke, tonal fill, or very soft shadow.
- Keep support modules uniform, non-nested, and visually subordinate.
- Do not use card-like structures in the hero, proof, CTA area, or elsewhere on the page.

#### Motion
- Motion is optional.
- Use motion only when it supports hierarchy, continuity, feedback, atmosphere, or topic logic.
- Default to none, minimal, or ambient motion depending on what the concept actually needs.
- Motion may live in typography, background behavior, proof logic, support-cluster behavior, or interaction feedback.
- A single key word or short phrase may use subtle text-based motion such as glitch, flicker, jitter, scanline shift, chromatic split, text scramble, pulse, or reveal if it strengthens the concept.
- Keep motion controlled, readable, non-blocking, and subordinate to clarity.
- Avoid scrolljacking, attention-hijacking loops, and ornamental animation.
- Respect reduced-motion preferences.

#### Accessibility and readability
- Preserve strong readability and clear hierarchy at all viewport sizes.
- Maintain sufficient contrast between text and background.
- Do not place essential text over busy imagery unless readability remains strong.
- Avoid cramped spacing, visual collisions, and weak focal hierarchy.
- Do not place badges, pills, annotations, stickers, or floating interface fragments over essential text.
- If the deliverable is code, use semantic HTML structure, visible focus states, keyboard-friendly interactions, and reduced-motion handling.
- When in doubt, preserve legibility over expressive overlap.

#### Anti-drift rules
- Do not drift into bland corporate SaaS styling.
- Do not default to dashboard aesthetics, feature-grid thinking, boxed-section composition, or template-like modularity.
- Do not use disconnected motifs, random color choices, or interchangeable abstract-tech shapes.
- Do not use card-within-card composition, nested surfaces, floating panels, fake proof, or stock-looking UI.
- Keep one visual world, one dominant hero, and one clear structural logic.
- Do not allow text, labels, or interface elements to overlap, collide, or sit on top of one another.

#### Output
Return only the final 기존 Spring Boot 정적 HTML/CSS/JavaScript 화면의 기능 개선.

If the deliverable is code:
- Output a complete production-ready file or component.
- Keep dependencies minimal unless explicitly requested.
- Make it responsive.
- Keep support highlights in one lower support cluster only when used.

#### Final self-check
Before returning, verify that the result keeps:
- one dominant hero
- one coherent visual world
- no invented proof
- no cardification outside the lower support cluster
- no generic SaaS drift
- no unnecessary structural fragmentation
- no nested containment
- no floating sub-surfaces
- all text clearly legible and comfortably spaced

기존 서비스 보존 규칙이 일반 랜딩 구성 규칙보다 우선한다. 혜택 카드와 개인 준비 목록은 제품의 실제 조작 화면이므로 재사용한다. 히어로를 재설계하거나 서비스의 기능을 지워서 랜딩 규칙에 맞추지 않는다.

##### Output target
- Path: src/main/resources/static/index.html (연결된 CSS/JavaScript 포함)


#### Variant 2 — 전 연령 디자인 프로토타입 (2026-10-25)

이번 요청의 결과는 디자인 1개다. 앞선 구현 계획을 보존하고 별도 /prototype/ 경로에 시안을 추가한다.

##### Resolved inputs
- Topic: 안심생활 공공혜택 탐색
- Offer: 편하게 읽고 검색·저장·준비를 눌러볼 수 있는 화면 시안
- Audience: 청소년부터 고령자까지, 다양한 시력과 디지털 숙련도의 한국어 사용자
- Primary user action: 검색 또는 생활 분야로 혜택 찾기
- Deliverable: 독립형 정적 HTML/CSS/JavaScript, 새 의존성 없음
- Style direction: 큰 글씨, 선명한 녹색, 따뜻한 흰색과 차분한 정보 위계
- Tonal key: Light
- Icon policy: 잎 로고와 2px 선형 SVG, 장식용은 aria-hidden
- Proof assets: 기존 기본 혜택 5건; 가상 성과나 현재 접수 판정 없음
- Motion intensity: Minimal. reduced-motion 존중

##### Composition contract
- Hero archetype: centered
- First-viewport structure: 짧은 서비스 제목, 검색 폼과 지역 선택, 내 상황으로 찾기 보조 행동. 아래에 생활 분야와 첫 혜택 목록의 시작이 보인다.
- Primary visual/proof artifact: 원래 저장소의 실제 혜택 이름·설명·지원대상. 별도 가짜 일러스트나 성과 없음
- Interaction behavior: 검색/지역/분야 필터, 상세 페이지 전환, 브라우저 저장/해제, 준비 체크와 날짜, 글자 크기 3단계, 키보드/뒤로가기
- Reuse boundary: 기존 폰트·녹색·잎 로고 언어 및 데이터만 재사용. 기존 제품 파일과 API를 덮어쓰지 않고 prototype/에 구성한다.

##### 목적, 메시지와 기준
현재 본문15px와 보조11~13px, 모바일 가로 숨김 필터, 큰 준비 요약 때문에 첫 기록이 아래로 밀리는 문제를 개선한다. 헤드라인은 나에게 필요한 혜택, 여기서 찾아보세요. 주요 CTA 혜택 찾기는 검색 함수, 보조 내 상황으로 찾기는 조건 선택 다이얼로그로 연결한다.

기존 Pretendard 사용. 기본 본문18px/1.65, 설명16px, 혜택 제목22px/1.45, 화면 제목32~44px, 버튼17px/600. 글자 크기 보통/크게/더 크게는 상대 단위로 확대하며 기본 브라우저 확대도 허용한다. 배경#f8faf8, 표면#ffffff, 본문#202b28, 보조#53615c, 주요녹색#14765b, 옅은녹색#edf5ef. 최대1120px, 모바일좌우20px, 간격8/12/16/24/32px, 반경12~16px. 실제 조작 영역은 최소44px, 주버튼52px 이상.

##### 화면과 콘텐츠
검색 시작→4개 생활 분야(기본 데이터에 존재하는 주거/생활/안전/문화)→읽기 쉬운 2열/모바일1열 혜택 목록. 상세는 누가/어떤 도움/신청기간/공식안내 순서. 저장 목록과 준비 목록은 실제 시안 사용자가 저장한 항목만 표시하며 처음에는 정직한 빈 상태. 모바일 하단 4개 메뉴 혜택 찾기/저장한 혜택/신청 준비/설정. 준비 목록 상태는 옆으로 숨기지 않는다. 긴 안내는 상세에 배치. 시안의 저장은 별도 localStorage 키를 쓰고 기존 계정 기록과 섞지 않는다.

##### 자산, 정직성과 접근성
새 이미지 자산 없음. 기존 local Pretendard 사용. 버튼 SVG 장식 숨김, 입력에 고정 레이블, 보이는 포커스. 상세/페이지 이동은 hash 및 브라우저 뒤로가기 지원. dialog Escape 및 포커스 복귀, storage 실패 안내, 빈 검색 복구, 긴 한국어 줄바꿈/min-width:0, 200% 확대, reduced-motion. 기본 데이터는 현재 모집정보가 아님을 화면에 표시. 외부 링크는 해당 데이터의 HTTP(S) 공식 URL만 사용. 공식 접수·자격확정·로그인 연동을 가장하지 않는다.

##### 수정 경로와 검증
새 src/main/resources/static/prototype/index.html, prototype.css, prototype.js만 구현. design.md 이번 절과 README 시안 경로 안내를 추가한다. 기존 백엔드/기능 코드는 보존한다. 구문 검사 후 로컬 정적 서버에서 검색→상세→저장→준비 체크를 눌러 확인. 360×800,390×844,768×1024,1440×900 및 큰 글씨, 넘침·초점·뒤로가기·콘솔 확인. 커밋·푸시·배포는 범위가 아니다.

##### Filled generation prompt
Create one high-concept page for 안심생활의 전 연령 공공혜택 탐색 프로토타입.

#### Inputs
- Topic: 안심생활의 전 연령 공공혜택 탐색 프로토타입.
- Offer: 찾고 읽고 저장하고 신청 준비를 이어가는 클릭형 화면 시안
- Audience: 청소년부터 고령자까지, 디지털 사용 경험이 다양한 한국어 사용자
- Primary user action: 검색어 또는 생활 분야로 필요한 혜택을 찾기
- Deliverable: 기존 정적 웹 스택의 독립형 HTML/CSS/JavaScript 프로토타입
- Style direction: 큰 글씨와 깊은 녹색, 따뜻한 흰색을 사용하는 읽기 쉬운 생활 안내
- Tonal key: Light
- Icon policy: 기존 잎 로고와 일관된 선형 SVG 아이콘
- Proof assets: 저장소 SupportProgramInitializer의 기본 혜택 5건만 사용. 시안임을 표시하고 사용자 수·금액·현재 모집 여부는 만들지 않음
- Motion intensity: Minimal

#### Objective
Design one premium, memorable page with a dominant hero and one coherent visual world derived from the topic itself.
The result should feel specific, intentional, and action-oriented when the concept calls for action, not like a generic startup or SaaS template.

Choose the strongest clear solution.
Do not collapse the concept into a simpler generic pattern just to make execution easier.

- Treat single-file execution as a packaging constraint, not a creative constraint.
Do not reduce conceptual ambition, visual specificity, interaction richness, or production quality merely because the deliverable is concise.

#### Internal concept choice
Before composing, decide internally:
- one dominant hero archetype: centered / asymmetrical / immersive
- one dominant proof mode: none / embedded gesture / single artifact
- one palette driver derived from the topic
- one tonal key: light / mid / dark / topic-derived
- one motion role: none / minimal / ambient / interactive
- one icon approach: none / minimal / expressive / topic-native
- optionally one secondary accent only if it strengthens the main direction without creating a second visual world
Do not output this planning.

#### Non-negotiables
- Use a strong hero-first composition.
- Headline: 3-12 words, max 3 lines.
- Supporting copy: 1-2 short sentences, concise and specific.
- CTAs are optional. If used, include at most 1 primary and 1 secondary CTA.
- If a clear next step is central to the offer or concept, include a CTA; otherwise CTA omission is allowed.
- CTA labels must be specific to the offer and action, not generic.
- Supporting highlights are optional. If used, show them only once in a single lower support cluster beneath the hero.
- Keep the hero dominant, focused, readable, and uncluttered.
- Proof is optional. Use it only if it clearly strengthens the concept.
- If no real proof assets are provided, do not invent metrics, testimonials, customer logos, screenshots, or fake UI proof.
- Prefer depth inside the hero, proof gesture, CTA behavior, support copy, or background logic rather than adding extra sections by default.

#### Composition
- Choose the clearest structure for the topic; do not default to generic two-column marketing layouts.
- A top navigation bar is optional. When used, make it native to the chosen style direction and subordinate to the hero rather than a generic boxed header.
- The hero may be fully integrated rather than framed.
- The hero does not need to become a panel, dashboard, device mockup, rounded card, or floating showcase unless the topic genuinely demands that artifact.
- Build hierarchy through scale, contrast, spacing, alignment, depth, rhythm, and composition before using frames, dividers, or containers.
- Keep supporting content clearly subordinate to the hero.
- Do not interpret structural restraint as permission to flatten the concept into a generic minimal layout.
- Do not use text-on-text layering, typographic collisions, or overlapping live text as a compositional device.

#### Visual system
- Build one coherent visual world derived from the topic itself.
- Let the topic drive palette, contrast, typography, spacing, geometry, motifs, materials, and motion.
- Even restrained palettes must feel intentional and specific, not generic premium-neutral.
- The background must actively contribute mood, depth, and topic logic.
- If the topic suggests a real system language, physical behavior, or interface grammar, show that directly instead of generic abstract-tech decoration.
- Treat headline typography as part of the concept, not neutral text.
- The headline may use topic-derived color, selective emphasis, multi-tone treatment, or gradient accents when they strengthen the concept and remain readable.
- Do not default the headline to neutral black, white, or near-white unless that is clearly the strongest topic-native choice.

#### Background and tonal diversity
- Premium and atmospheric design may be light, mid-tone, or dark; do not default to dark.
- Choose the tonal key from the topic, offer, audience, and style direction rather than from generic cinematic or tech aesthetics.
- Contrast may come from hue, saturation, temperature, texture, density, or scale, not only darkness.

#### Proof and concept expression
- Prefer the minimum visual evidence needed to make the idea feel specific, credible, and native to the topic.
- If the concept is strongest with typography, atmosphere, and one precise gesture, do that.
- If a stronger proof artifact is justified, use one legible, unified artifact rather than multiple fragmented panels.
- Proof may take the form of a signal, trace, contour, command line, path, specimen, structural mark, scene fragment, or other topic-native evidence.
- Typography itself may carry part of the concept or proof.
- When appropriate, use one precise typographic gesture—such as selective word emphasis, chromatic offset, gradient emphasis, distortion, signal breakup, or structural interruption—to make the concept feel more specific and alive.
- Prefer one strong typographic intervention over many scattered decorative effects.
- Avoid decorative pseudo-proof.
- Avoid turning simple ideas into framed showcases, dashboard fragments, floating panels, softened slabs, or generic marketing geometry.

#### Icons and symbolic language
- Icons are optional.
- Use icons only when they improve scanability, recognition, navigation, proof clarity, or support-cluster legibility.
- Prefer topic-native icon logic over generic startup glyphs.
- Keep icon style consistent in stroke weight, geometry, corner logic, and detail level.
- Use icons primarily in clearly secondary roles unless a single topic-native symbol is central to the concept.
- Do not let icons compete with the hero headline, proof artifact, or CTA hierarchy.

#### Support cluster
- If used, show supporting highlights only once, in a single lower cluster beneath the hero.
- Each highlight should be short, fast to scan, and clearly secondary.
- Supporting highlights may use concise icons or symbolic marks when helpful.
- Support-cluster elements may use subtle motion when it improves scanability, continuity, or atmosphere and remains clearly secondary.
- Card-like grouping is allowed only inside this lower support cluster.
- These modules may use at most one light surface treatment, such as a subtle stroke, tonal fill, or very soft shadow.
- Keep support modules uniform, non-nested, and visually subordinate.
- Do not use card-like structures in the hero, proof, CTA area, or elsewhere on the page.

#### Motion
- Motion is optional.
- Use motion only when it supports hierarchy, continuity, feedback, atmosphere, or topic logic.
- Default to none, minimal, or ambient motion depending on what the concept actually needs.
- Motion may live in typography, background behavior, proof logic, support-cluster behavior, or interaction feedback.
- A single key word or short phrase may use subtle text-based motion such as glitch, flicker, jitter, scanline shift, chromatic split, text scramble, pulse, or reveal if it strengthens the concept.
- Keep motion controlled, readable, non-blocking, and subordinate to clarity.
- Avoid scrolljacking, attention-hijacking loops, and ornamental animation.
- Respect reduced-motion preferences.

#### Accessibility and readability
- Preserve strong readability and clear hierarchy at all viewport sizes.
- Maintain sufficient contrast between text and background.
- Do not place essential text over busy imagery unless readability remains strong.
- Avoid cramped spacing, visual collisions, and weak focal hierarchy.
- Do not place badges, pills, annotations, stickers, or floating interface fragments over essential text.
- If the deliverable is code, use semantic HTML structure, visible focus states, keyboard-friendly interactions, and reduced-motion handling.
- When in doubt, preserve legibility over expressive overlap.

#### Anti-drift rules
- Do not drift into bland corporate SaaS styling.
- Do not default to dashboard aesthetics, feature-grid thinking, boxed-section composition, or template-like modularity.
- Do not use disconnected motifs, random color choices, or interchangeable abstract-tech shapes.
- Do not use card-within-card composition, nested surfaces, floating panels, fake proof, or stock-looking UI.
- Keep one visual world, one dominant hero, and one clear structural logic.
- Do not allow text, labels, or interface elements to overlap, collide, or sit on top of one another.

#### Output
Return only the final 기존 정적 웹 스택의 독립형 HTML/CSS/JavaScript 프로토타입.

If the deliverable is code:
- Output a complete production-ready file or component.
- Keep dependencies minimal unless explicitly requested.
- Make it responsive.
- Keep support highlights in one lower support cluster only when used.

#### Final self-check
Before returning, verify that the result keeps:
- one dominant hero
- one coherent visual world
- no invented proof
- no cardification outside the lower support cluster
- no generic SaaS drift
- no unnecessary structural fragmentation
- no nested containment
- no floating sub-surfaces
- all text clearly legible and comfortably spaced

제품 검색 결과의 혜택 카드와 준비 체크는 실제 조작 콘텐츠이므로 허용한다. 광고성 가짜 proof는 사용하지 않는다. 기존 제품과 분리된 시안이며 화면에 명시한다.

##### Output target
- Path: src/main/resources/static/prototype/index.html


#### Variant 3 — 사용자 레퍼런스의 흑백·검정 타일 시안 (2026-10-25)

이번 결과는 별도 시안 1개다. 사용자가 이미지와 함께 흑백 배경·검정 타일까지 비슷한 분위기로 요청했다. 앞선 밝은 시안은 보존한다.

##### Resolved inputs
- Topic: 안심생활 공공혜택 발견
- Offer: 중앙 검색과 분야별 탐색을 이용하는 흑백 사진 기반 화면 시안
- Audience: 남녀노소, 다양한 디지털 숙련도의 한국어 사용자
- Primary user action: 중앙 검색 또는 주거/생활/안전/문화 타일 선택
- Deliverable: 정적 HTML/CSS/JS 클릭형 프로토타입
- Style direction: 흑백 도시 사진 전체 배경, 대형 흰색 타이틀, 검정 직사각형과 사진을 결합한 엇갈린 타일
- Tonal key: Dark hero, light reading surfaces
- Icon policy: 기존 일관된 선형 SVG 및 잎 로고
- Proof assets: 기존 기본 혜택5건, Ann Danilina·Ryoo Geon Uk·Greg Willson의 Unsplash 사진, 사용자가 제공한 레퍼런스는 구성 참고만
- Motion intensity: Minimal; reduced-motion 존중

##### Composition contract
- Hero archetype: immersive
- First-viewport structure: 투명 헤더, 중앙의 큰 안심생활 제목과 설명, 흰 검색창. 검색 아래 얇은 지역선택·내상황 CTA. 하단에 검정+사진 타일이 시작되며 격자 선과 여백이 구도를 연결
- Primary visual/proof artifact: 한국 도시의 실제 흑백 사진 및 분야별 검정/사진 타일. 가상 사용자 수·리뷰·혜택 금액 없음
- Interaction behavior: 타일을 누르면 실제 예시 혜택만 필터링해 밝은 목록으로 이동. 검색/지역/상세/저장/준비체크/큰글씨/뒤로가기 제공
- Reuse boundary: 기존 폰트·아이콘·접근성·시안의 데이터/상세 흐름을 재사용. 홈은 별도 immersive hero와 직접 정의한 엇갈린 tile 구도로 구현

##### 시각·내용·기능 기준
흑백 사진은 서울 도시 풍경으로 서비스의 생활 맥락과 연결. 배경#1b1d1c, 검정 타일#080a09, 글자#ffffff, 큰 타일 제목32~36px/700, 본문18px/1.65, 부가16px. 헤드라인은 안심생활, PC96px/모바일52px. 검색창 흰색/글자#202b28, 높이60px 이상, 최대660px. 녹색/황토/푸른색/살구색은 작은 아이콘과 타일 꼬리말에 제한. PC최대1240px, 격자3열·3행에 타일을 1열1행/2열2행/1열3행/3열3행 배치. 768px는2열 stagger, 600px이하1열로 4개를 순서대로 배치해 빈 공간과 이동거리를 줄인다. 큰글씨에서 타일 높이는 콘텐츠에 맞게 증가. 스크롤 고정배경·자동 모션 없음.

##### 데이터와 자산
사진 원문: https://unsplash.com/photos/grayscale-photo-of-city-buildings-_l_6rugtshA (Ann Danilina), https://unsplash.com/photos/a-black-and-white-photo-of-a-large-city-Q8cWodJp1SM (Ryoo Geon Uk), https://unsplash.com/photos/street-lights-illuminate-a-busy-city-street-at-night-h7Rgf37HvVc (Greg Willson). 각 원문 Free to use under Unsplash License 확인. 라이선스 https://unsplash.com/license . 사진은 장식이며 빈 alt, 타일은 제목/목적이 보이는 실제 button. 텍스트와 사진은 겹치지 않는 검정 영역에서 제공. 상단 흰 텍스트 아래 사진에 명암 오버레이. 사진 실패 시 단색 배경과 타일 내용/기능 유지. 로고·원본 사이트 콘텐츠·숫자는 복제하지 않음.

##### 수정 경로·계약·검증
새 prototype/reference.html, reference.css, reference.js, assets/사진3장 및 출처문서. 기존 prototype/index.html·기존 제품 파일·계정 데이터 보존. 저장키 ansimlife.prototype.reference.v1로 분리. 실제 모집 여부·연동·신청을 가장하지 않음. 구문검사 및 360/390/768/1440 뷰포트, 큰글씨·키보드·검색→상세→저장/준비 흐름·사진 로드·콘솔 확인. 커밋/푸시/배포는 범위 아님.

##### Filled generation prompt
Create one high-concept page for 안심생활의 흑백 사진과 검정 타일 중심 레퍼런스 시안.

#### Inputs
- Topic: 안심생활의 흑백 사진과 검정 타일 중심 레퍼런스 시안.
- Offer: 공공혜택을 검색하고 생활 분야로 탐색하는 클릭형 프로토타입
- Audience: 청소년부터 고령자까지 다양한 한국어 사용자
- Primary user action: 중앙 검색창 또는 분야별 검정 타일을 통해 혜택 찾기
- Deliverable: 기존 정적 스택의 별도 HTML/CSS/JavaScript 시안 1개
- Style direction: 사용자가 첨부한 DataPlanet 화면의 흑백 사진 배경·큰 중앙 타이틀·엇갈린 검정 사진 타일을 참고한 편집형 구성
- Tonal key: Dark hero and light reading surfaces
- Icon policy: 일관된 선형 SVG와 기존 잎 로고
- Proof assets: 저장소 기본 혜택5건 및 Unsplash 무료 사진3장. 출처와 시안임을 표시
- Motion intensity: Minimal

#### Objective
Design one premium, memorable page with a dominant hero and one coherent visual world derived from the topic itself.
The result should feel specific, intentional, and action-oriented when the concept calls for action, not like a generic startup or SaaS template.

Choose the strongest clear solution.
Do not collapse the concept into a simpler generic pattern just to make execution easier.

- Treat single-file execution as a packaging constraint, not a creative constraint.
Do not reduce conceptual ambition, visual specificity, interaction richness, or production quality merely because the deliverable is concise.

#### Internal concept choice
Before composing, decide internally:
- one dominant hero archetype: centered / asymmetrical / immersive
- one dominant proof mode: none / embedded gesture / single artifact
- one palette driver derived from the topic
- one tonal key: light / mid / dark / topic-derived
- one motion role: none / minimal / ambient / interactive
- one icon approach: none / minimal / expressive / topic-native
- optionally one secondary accent only if it strengthens the main direction without creating a second visual world
Do not output this planning.

#### Non-negotiables
- Use a strong hero-first composition.
- Headline: 3-12 words, max 3 lines.
- Supporting copy: 1-2 short sentences, concise and specific.
- CTAs are optional. If used, include at most 1 primary and 1 secondary CTA.
- If a clear next step is central to the offer or concept, include a CTA; otherwise CTA omission is allowed.
- CTA labels must be specific to the offer and action, not generic.
- Supporting highlights are optional. If used, show them only once in a single lower support cluster beneath the hero.
- Keep the hero dominant, focused, readable, and uncluttered.
- Proof is optional. Use it only if it clearly strengthens the concept.
- If no real proof assets are provided, do not invent metrics, testimonials, customer logos, screenshots, or fake UI proof.
- Prefer depth inside the hero, proof gesture, CTA behavior, support copy, or background logic rather than adding extra sections by default.

#### Composition
- Choose the clearest structure for the topic; do not default to generic two-column marketing layouts.
- A top navigation bar is optional. When used, make it native to the chosen style direction and subordinate to the hero rather than a generic boxed header.
- The hero may be fully integrated rather than framed.
- The hero does not need to become a panel, dashboard, device mockup, rounded card, or floating showcase unless the topic genuinely demands that artifact.
- Build hierarchy through scale, contrast, spacing, alignment, depth, rhythm, and composition before using frames, dividers, or containers.
- Keep supporting content clearly subordinate to the hero.
- Do not interpret structural restraint as permission to flatten the concept into a generic minimal layout.
- Do not use text-on-text layering, typographic collisions, or overlapping live text as a compositional device.

#### Visual system
- Build one coherent visual world derived from the topic itself.
- Let the topic drive palette, contrast, typography, spacing, geometry, motifs, materials, and motion.
- Even restrained palettes must feel intentional and specific, not generic premium-neutral.
- The background must actively contribute mood, depth, and topic logic.
- If the topic suggests a real system language, physical behavior, or interface grammar, show that directly instead of generic abstract-tech decoration.
- Treat headline typography as part of the concept, not neutral text.
- The headline may use topic-derived color, selective emphasis, multi-tone treatment, or gradient accents when they strengthen the concept and remain readable.
- Do not default the headline to neutral black, white, or near-white unless that is clearly the strongest topic-native choice.

#### Background and tonal diversity
- Premium and atmospheric design may be light, mid-tone, or dark; do not default to dark.
- Choose the tonal key from the topic, offer, audience, and style direction rather than from generic cinematic or tech aesthetics.
- Contrast may come from hue, saturation, temperature, texture, density, or scale, not only darkness.

#### Proof and concept expression
- Prefer the minimum visual evidence needed to make the idea feel specific, credible, and native to the topic.
- If the concept is strongest with typography, atmosphere, and one precise gesture, do that.
- If a stronger proof artifact is justified, use one legible, unified artifact rather than multiple fragmented panels.
- Proof may take the form of a signal, trace, contour, command line, path, specimen, structural mark, scene fragment, or other topic-native evidence.
- Typography itself may carry part of the concept or proof.
- When appropriate, use one precise typographic gesture—such as selective word emphasis, chromatic offset, gradient emphasis, distortion, signal breakup, or structural interruption—to make the concept feel more specific and alive.
- Prefer one strong typographic intervention over many scattered decorative effects.
- Avoid decorative pseudo-proof.
- Avoid turning simple ideas into framed showcases, dashboard fragments, floating panels, softened slabs, or generic marketing geometry.

#### Icons and symbolic language
- Icons are optional.
- Use icons only when they improve scanability, recognition, navigation, proof clarity, or support-cluster legibility.
- Prefer topic-native icon logic over generic startup glyphs.
- Keep icon style consistent in stroke weight, geometry, corner logic, and detail level.
- Use icons primarily in clearly secondary roles unless a single topic-native symbol is central to the concept.
- Do not let icons compete with the hero headline, proof artifact, or CTA hierarchy.

#### Support cluster
- If used, show supporting highlights only once, in a single lower cluster beneath the hero.
- Each highlight should be short, fast to scan, and clearly secondary.
- Supporting highlights may use concise icons or symbolic marks when helpful.
- Support-cluster elements may use subtle motion when it improves scanability, continuity, or atmosphere and remains clearly secondary.
- Card-like grouping is allowed only inside this lower support cluster.
- These modules may use at most one light surface treatment, such as a subtle stroke, tonal fill, or very soft shadow.
- Keep support modules uniform, non-nested, and visually subordinate.
- Do not use card-like structures in the hero, proof, CTA area, or elsewhere on the page.

#### Motion
- Motion is optional.
- Use motion only when it supports hierarchy, continuity, feedback, atmosphere, or topic logic.
- Default to none, minimal, or ambient motion depending on what the concept actually needs.
- Motion may live in typography, background behavior, proof logic, support-cluster behavior, or interaction feedback.
- A single key word or short phrase may use subtle text-based motion such as glitch, flicker, jitter, scanline shift, chromatic split, text scramble, pulse, or reveal if it strengthens the concept.
- Keep motion controlled, readable, non-blocking, and subordinate to clarity.
- Avoid scrolljacking, attention-hijacking loops, and ornamental animation.
- Respect reduced-motion preferences.

#### Accessibility and readability
- Preserve strong readability and clear hierarchy at all viewport sizes.
- Maintain sufficient contrast between text and background.
- Do not place essential text over busy imagery unless readability remains strong.
- Avoid cramped spacing, visual collisions, and weak focal hierarchy.
- Do not place badges, pills, annotations, stickers, or floating interface fragments over essential text.
- If the deliverable is code, use semantic HTML structure, visible focus states, keyboard-friendly interactions, and reduced-motion handling.
- When in doubt, preserve legibility over expressive overlap.

#### Anti-drift rules
- Do not drift into bland corporate SaaS styling.
- Do not default to dashboard aesthetics, feature-grid thinking, boxed-section composition, or template-like modularity.
- Do not use disconnected motifs, random color choices, or interchangeable abstract-tech shapes.
- Do not use card-within-card composition, nested surfaces, floating panels, fake proof, or stock-looking UI.
- Keep one visual world, one dominant hero, and one clear structural logic.
- Do not allow text, labels, or interface elements to overlap, collide, or sit on top of one another.

#### Output
Return only the final 기존 정적 스택의 별도 HTML/CSS/JavaScript 시안 1개.

If the deliverable is code:
- Output a complete production-ready file or component.
- Keep dependencies minimal unless explicitly requested.
- Make it responsive.
- Keep support highlights in one lower support cluster only when used.

#### Final self-check
Before returning, verify that the result keeps:
- one dominant hero
- one coherent visual world
- no invented proof
- no cardification outside the lower support cluster
- no generic SaaS drift
- no unnecessary structural fragmentation
- no nested containment
- no floating sub-surfaces
- all text clearly legible and comfortably spaced

사용자가 제공한 레퍼런스에 맞춘 black tile과 immersive photo 구도를 따른다. 서비스 탐색 타일과 실제 검색 결과는 조작 콘텐츠로 허용한다. 모바일에서는 의도적으로 일렬로 재배치한다.

##### Output target
- Path: src/main/resources/static/prototype/reference.html


#### Variant 3 refinement — 전체 화면 디자인 재구성 (2026-10-25)

사용자 정정: 레퍼런스를 그대로 복제하지 말고 비슷한 분위기에서 더 아름답게, 폰트·간격·배치를 모든 페이지에 적용. 기존 레퍼런스 시안 한 개를 같은 URL에서 수정한다. 과거 계획은 기록으로 보존하며 이번 문서가 현재 구현의 우선 기준이다.

##### Resolved inputs
- Topic: 안심생활 전 연령 공공혜택 탐색·준비
- Offer: 찾기→읽기→저장→준비 흐름이 일관된 클릭형 시안
- Audience: 전 연령 한국어 사용자와 큰글씨 사용자
- Primary user action: 검색 및 분야 선택으로 혜택 찾기
- Deliverable: reference.html 및 연결 CSS/JS의 전체 화면 개편 1개
- Style direction: 차콜/짙은녹색, 흑백 도시사진, 따뜻한 흰색과 정교한 타이포그래피를 쓰는 생활 안내
- Tonal key: Dark discovery hero + light reading surfaces
- Icon policy: 기존2px 선형SVG와 잎 로고. 장식 아이콘 aria-hidden
- Proof assets: 기본 혜택5건·출처 있는 사진3장·시안에서 직접 저장한 기록. 가상성과 없음
- Motion intensity: Minimal. 피드백과 hover만, reduced-motion 존중

##### Composition contract
- Hero archetype: asymmetrical
- First-viewport structure: 좌측에 의미 있는 제목과 설명, 우측에 도시 풍경이 드러나는 단일 사진. 아래에 검색/지역/CTA를 결합한 폼. 다음 구역의 네 개 분야는 같은 기준선에 정렬해 탐색을 빠르게 한다
- Primary visual/proof artifact: 실제 도시 사진 한 장과 실제 예시 혜택 목록. 원본 레퍼런스의 엇갈린 빈 격자·거대 브랜드 제목·같은 사진의 반복은 제거
- Interaction behavior: 검색/분야/지역/정렬, 정보 중심 상세, 저장/해제, 준비 목록의 상태 필터, 개별 체크/확인일, 설정/큰글씨, 조건 선택 대화상자, 빈 결과/재탐색/뒤로가기
- Reuse boundary: 기존 데이터·저장키·출처·시안 한계 보존. reference.html·reference.js·reference.css를 수정하며 밝은 첫 시안과 실제 제품/서버 코드는 보존

##### 목적과 현재 문제
현재 레퍼런스 시안은 브랜드명만 큰 제목, 사진 위의 3행 엇갈린 검정 타일과 빈 격자를 그대로 차용해 서비스의 독자적인 구성이 약하다. 상세·저장·준비·설정 화면은 이전 밝은 시안의 단순한 구조여서 홈과 시각 언어가 다르고 글자/간격의 규칙도 분산되어 있다. 모바일 긴 검정 타일과 작은 부가설명 때문에 탐색과 읽기 위계가 불균형하다.

##### 메시지·CTA·시각 기준
홈 제목은 나에게 필요한 혜택, 더 쉽게 찾아요. 주 CTA 혜택 찾기는 검색, 보조 내 상황으로 찾기는 조건 선택 dialog. 상세 주 CTA 신청 준비하기는 준비 기록 생성/이동, 공식 안내는 실제 외부 기관 링크. 저장/준비는 시안 브라우저 전용으로 명시한다.

Pretendard 유지. 본문18px/1.7, 안내16px/1.65, 카드제목22px/1.45 weight650, 화면제목40px/1.35 weight700, 홈54px/1.25(모바일32px), 조작17px/600. 굵기는400/500/600/700 중심, 본문 자간-.015em, 제목-.035em. 배경#f4f6f2, 표면#ffffff, 본문#1e3028, 보조#55685d, 주요녹색#1b6b50, 히어로#15271e, 연녹색#eaf2e7, 히어로 강조#c4dfbb. 최대1120px, 읽기본문최대720px, 모바일좌우20px, 간격8/12/16/24/32/48/64px. 반경12~18px, 테두리1px #dce4dc. 주요 버튼56px, 보조48px, 기타 타깃44px 이상. 큰 글씨시 rem으로 확대하고 고정 높이 대신 min-height.

##### 전체 화면 구성
1. 홈: 단일사진 비대칭 제목·결합검색폼·정렬된 네 개 어두운 분야 타일. 하단 밝은 결과 2열/모바일1열. 카드에는 분류, 제목, 짧은 설명, 대상/지원, 기간, 상세 행동을 고정 순서로 표시
2. 상세: 카테고리/큰 제목/소개 다음 정보 섹션을 넓고 명확하게 구분. 우측 공식안내·준비 행동 요약은 작은 이미지와 지역·기본기간을 포함. 모바일은 본문 뒤에 행동을 흐름대로 배치
3. 저장: 전용 제목·실제 항목 수·정리된 카드, 의미 있는 빈 상태와 다시 찾기 CTA
4. 준비 목록: 실제 기록 수와 작고 선명한 상태 필터, 기록별 실제 체크 진행도·확인일·이어서 준비. 필터 빈 상태에서 전체 보기로 복귀
5. 개별 준비: 큰 제목과 진행도, 넉넉한 네 개 체크행, 다음 확인일 영역과 공식안내 버튼. 체크 완료를 접수 완료로 표시하지 않음
6. 설정: 큰글씨 선택과 예문, 이용안내 accordion. 동일한 카드/제목/버튼/간격 체계. PC에서도 설정에 직접 접근 가능
7. 조건 선택 dialog 및 오류/빈 화면: 같은 폰트·폼·모서리·포커스 기준. 닫기/ESC/포커스 복귀

##### 자산·계약·검증
기존사진3장과 폰트/아이콘 재사용, 출처문서 보존. 개인/공식 데이터나 성과를 새로 지어내지 않음. localStorage키 ansimlife.prototype.reference.v1 유지. 헤더·모바일4개메뉴·모든페이지hash·기존 저장/체크 로직 보존. 새 패키지나 스택 변경 없음.

reference.css를 완결된 디자인 시스템으로 정리하고 reference.js의 모든 renderer와 reference.html shell/조건폼을 맞춘다. README 현재 시안 설명 갱신. 구문검사 후 모든 경로의 PC/모바일 화면을 직접 확인하고 360/390/768/1440 및 큰글씨, Tab/Enter/Space/ESC, 저장→복원·필터·날짜·뒤로가기·콘솔을 검증한다. 200% 확대와 실제 보조기기는 가능한 범위에서만 확인하고 미확인 항목 구분. 커밋·푸시·배포는 요청 범위 아님.

##### Filled generation prompt
Create one high-concept page for 안심생활의 모든 프로토타입 화면을 위한 차분한 편집형 생활 서비스.

#### Inputs
- Topic: 안심생활의 모든 프로토타입 화면을 위한 차분한 편집형 생활 서비스.
- Offer: 필요한 공공혜택을 발견하고 읽고 저장하고 준비하는 완결된 클릭 흐름
- Audience: 전 연령 한국어 사용자, 다양한 시력과 디지털 숙련도
- Primary user action: 검색 또는 생활 분야로 필요한 혜택 찾기
- Deliverable: 기존 reference.html 경로의 전체 화면 HTML/CSS/JavaScript 개편
- Style direction: 흑백 도시 사진·짙은 녹색·따뜻한 흰색을 사용하는 현대적인 편집형 제품 디자인
- Tonal key: 사진 중심의 짙은 히어로, 밝은 정보 화면
- Icon policy: 일관된 선형 SVG와 기존 잎 로고
- Proof assets: 기본 혜택5건 및 이미 확보한 출처 있는 사진3장, 사용자가 직접 저장한 시안 기록
- Motion intensity: Minimal

#### Objective
Design one premium, memorable page with a dominant hero and one coherent visual world derived from the topic itself.
The result should feel specific, intentional, and action-oriented when the concept calls for action, not like a generic startup or SaaS template.

Choose the strongest clear solution.
Do not collapse the concept into a simpler generic pattern just to make execution easier.

- Treat single-file execution as a packaging constraint, not a creative constraint.
Do not reduce conceptual ambition, visual specificity, interaction richness, or production quality merely because the deliverable is concise.

#### Internal concept choice
Before composing, decide internally:
- one dominant hero archetype: centered / asymmetrical / immersive
- one dominant proof mode: none / embedded gesture / single artifact
- one palette driver derived from the topic
- one tonal key: light / mid / dark / topic-derived
- one motion role: none / minimal / ambient / interactive
- one icon approach: none / minimal / expressive / topic-native
- optionally one secondary accent only if it strengthens the main direction without creating a second visual world
Do not output this planning.

#### Non-negotiables
- Use a strong hero-first composition.
- Headline: 3-12 words, max 3 lines.
- Supporting copy: 1-2 short sentences, concise and specific.
- CTAs are optional. If used, include at most 1 primary and 1 secondary CTA.
- If a clear next step is central to the offer or concept, include a CTA; otherwise CTA omission is allowed.
- CTA labels must be specific to the offer and action, not generic.
- Supporting highlights are optional. If used, show them only once in a single lower support cluster beneath the hero.
- Keep the hero dominant, focused, readable, and uncluttered.
- Proof is optional. Use it only if it clearly strengthens the concept.
- If no real proof assets are provided, do not invent metrics, testimonials, customer logos, screenshots, or fake UI proof.
- Prefer depth inside the hero, proof gesture, CTA behavior, support copy, or background logic rather than adding extra sections by default.

#### Composition
- Choose the clearest structure for the topic; do not default to generic two-column marketing layouts.
- A top navigation bar is optional. When used, make it native to the chosen style direction and subordinate to the hero rather than a generic boxed header.
- The hero may be fully integrated rather than framed.
- The hero does not need to become a panel, dashboard, device mockup, rounded card, or floating showcase unless the topic genuinely demands that artifact.
- Build hierarchy through scale, contrast, spacing, alignment, depth, rhythm, and composition before using frames, dividers, or containers.
- Keep supporting content clearly subordinate to the hero.
- Do not interpret structural restraint as permission to flatten the concept into a generic minimal layout.
- Do not use text-on-text layering, typographic collisions, or overlapping live text as a compositional device.

#### Visual system
- Build one coherent visual world derived from the topic itself.
- Let the topic drive palette, contrast, typography, spacing, geometry, motifs, materials, and motion.
- Even restrained palettes must feel intentional and specific, not generic premium-neutral.
- The background must actively contribute mood, depth, and topic logic.
- If the topic suggests a real system language, physical behavior, or interface grammar, show that directly instead of generic abstract-tech decoration.
- Treat headline typography as part of the concept, not neutral text.
- The headline may use topic-derived color, selective emphasis, multi-tone treatment, or gradient accents when they strengthen the concept and remain readable.
- Do not default the headline to neutral black, white, or near-white unless that is clearly the strongest topic-native choice.

#### Background and tonal diversity
- Premium and atmospheric design may be light, mid-tone, or dark; do not default to dark.
- Choose the tonal key from the topic, offer, audience, and style direction rather than from generic cinematic or tech aesthetics.
- Contrast may come from hue, saturation, temperature, texture, density, or scale, not only darkness.

#### Proof and concept expression
- Prefer the minimum visual evidence needed to make the idea feel specific, credible, and native to the topic.
- If the concept is strongest with typography, atmosphere, and one precise gesture, do that.
- If a stronger proof artifact is justified, use one legible, unified artifact rather than multiple fragmented panels.
- Proof may take the form of a signal, trace, contour, command line, path, specimen, structural mark, scene fragment, or other topic-native evidence.
- Typography itself may carry part of the concept or proof.
- When appropriate, use one precise typographic gesture—such as selective word emphasis, chromatic offset, gradient emphasis, distortion, signal breakup, or structural interruption—to make the concept feel more specific and alive.
- Prefer one strong typographic intervention over many scattered decorative effects.
- Avoid decorative pseudo-proof.
- Avoid turning simple ideas into framed showcases, dashboard fragments, floating panels, softened slabs, or generic marketing geometry.

#### Icons and symbolic language
- Icons are optional.
- Use icons only when they improve scanability, recognition, navigation, proof clarity, or support-cluster legibility.
- Prefer topic-native icon logic over generic startup glyphs.
- Keep icon style consistent in stroke weight, geometry, corner logic, and detail level.
- Use icons primarily in clearly secondary roles unless a single topic-native symbol is central to the concept.
- Do not let icons compete with the hero headline, proof artifact, or CTA hierarchy.

#### Support cluster
- If used, show supporting highlights only once, in a single lower cluster beneath the hero.
- Each highlight should be short, fast to scan, and clearly secondary.
- Supporting highlights may use concise icons or symbolic marks when helpful.
- Support-cluster elements may use subtle motion when it improves scanability, continuity, or atmosphere and remains clearly secondary.
- Card-like grouping is allowed only inside this lower support cluster.
- These modules may use at most one light surface treatment, such as a subtle stroke, tonal fill, or very soft shadow.
- Keep support modules uniform, non-nested, and visually subordinate.
- Do not use card-like structures in the hero, proof, CTA area, or elsewhere on the page.

#### Motion
- Motion is optional.
- Use motion only when it supports hierarchy, continuity, feedback, atmosphere, or topic logic.
- Default to none, minimal, or ambient motion depending on what the concept actually needs.
- Motion may live in typography, background behavior, proof logic, support-cluster behavior, or interaction feedback.
- A single key word or short phrase may use subtle text-based motion such as glitch, flicker, jitter, scanline shift, chromatic split, text scramble, pulse, or reveal if it strengthens the concept.
- Keep motion controlled, readable, non-blocking, and subordinate to clarity.
- Avoid scrolljacking, attention-hijacking loops, and ornamental animation.
- Respect reduced-motion preferences.

#### Accessibility and readability
- Preserve strong readability and clear hierarchy at all viewport sizes.
- Maintain sufficient contrast between text and background.
- Do not place essential text over busy imagery unless readability remains strong.
- Avoid cramped spacing, visual collisions, and weak focal hierarchy.
- Do not place badges, pills, annotations, stickers, or floating interface fragments over essential text.
- If the deliverable is code, use semantic HTML structure, visible focus states, keyboard-friendly interactions, and reduced-motion handling.
- When in doubt, preserve legibility over expressive overlap.

#### Anti-drift rules
- Do not drift into bland corporate SaaS styling.
- Do not default to dashboard aesthetics, feature-grid thinking, boxed-section composition, or template-like modularity.
- Do not use disconnected motifs, random color choices, or interchangeable abstract-tech shapes.
- Do not use card-within-card composition, nested surfaces, floating panels, fake proof, or stock-looking UI.
- Keep one visual world, one dominant hero, and one clear structural logic.
- Do not allow text, labels, or interface elements to overlap, collide, or sit on top of one another.

#### Output
Return only the final 기존 reference.html 경로의 전체 화면 HTML/CSS/JavaScript 개편.

If the deliverable is code:
- Output a complete production-ready file or component.
- Keep dependencies minimal unless explicitly requested.
- Make it responsive.
- Keep support highlights in one lower support cluster only when used.

#### Final self-check
Before returning, verify that the result keeps:
- one dominant hero
- one coherent visual world
- no invented proof
- no cardification outside the lower support cluster
- no generic SaaS drift
- no unnecessary structural fragmentation
- no nested containment
- no floating sub-surfaces
- all text clearly legible and comfortably spaced

서비스의 실제 조작 화면에는 혜택 카드와 체크 항목 표면을 사용한다. 사진 위의 읽기 어려운 정보나 가짜 성과, 격자 복제는 사용하지 않는다. 모든 화면의 타이포그래피/간격/CTA가 같은 규칙을 따라야 한다.

##### Output target
- Path: src/main/resources/static/prototype/reference.html (reference.css, reference.js 포함)

검증 후 보완: 모바일 상세 상단에 준비·저장 바로가기를 제공해 긴 본문을 끝까지 내리지 않아도 조작할 수 있게 한다. 본문 아래 행동도 유지하고 중복 저장 버튼의 상태를 함께 갱신한다. 저장 목록에 한 항목만 있으면 PC 읽기 폭을 740px로 정리한다.

검증 결과: 360×800·390×844·768×1024·1440×900 화면과 작은 화면의 큰 글씨를 직접 확인했다. 검색·빈 상태 복구·상세·저장 상태 동기화·준비 필터·체크/확인일 복원·설정·키보드 안내창 닫기/복귀를 확인했다. 여러 줄 카드 제목을 영역 전체로 누를 수 있도록 블록 링크로 바꾸고, 검색 입력·지역 선택의 키보드 포커스 표시를 보강했다. JavaScript 구문 검사 및 diff 공백 검사 통과, 브라우저 오류·경고 없음. 화면 확대 200%와 실제 보조기기 검증은 미수행. 로컬 시안만 수정하며 커밋·푸시·배포 없음.


#### Production rollout — 확정 디자인의 실제 서비스 전체 적용 (2026-10-25)

##### 근거와 범위
서비스는 Spring Boot/Java 21, JPA/PostgreSQL과 일반 HTML/CSS/JavaScript를 사용한다. 실제 API는 공공혜택 검색·상세, 세션 로그인, 맞춤 프로필, 준비 체크 및 사용자 진행 기록, 정보 제보를 제공한다. 검색 저장·관심·비교·최근 기록은 기존 브라우저 저장소를 유지한다. 사용자는 reference.html의 흑백 도시 사진, 짙은 타일, Pretendard, 밝은 읽기 화면을 확정했고 이번에 실제 서비스 적용 및 배포를 명시적으로 요청했다. 기존 변경사항을 보존하고 검증 후 함께 반영한다.

##### Resolved inputs
- Topic: 안심생활의 실제 공공혜택 발견·비교·신청 준비 서비스 전체 화면.
- Offer: 공식 출처의 지원 정보를 찾고 계정에 준비 체크·진행 상태·다음 확인일을 저장하는 서비스.
- Audience: 청년부터 고령자까지 다양한 연령의 한국어 사용자.
- Primary user action: 검색어와 지역으로 실제 /api/programs 결과를 찾기.
- Deliverable: 기존 HTML/CSS/JavaScript와 실제 Spring API를 유지한 운영 가능한 화면 1개 디자인 체계.
- Style direction: 확정된 흑백 도시 사진과 어두운 녹색 타일, 따뜻한 밝은 읽기 화면.
- Tonal key: 홈은 Dark, 정보·계정·준비 화면은 Light.
- Icon policy: 기존 SVG sprite만 재사용. 텍스트 화살표나 이모지 장식은 새로 추가하지 않는다.
- Proof assets: 기존 라이선스 확인된 서울 사진, 실제 /api/programs/meta의 데이터 상태, 실제 API 결과. 가짜 지표·후기 없음.
- Motion intensity: Minimal. 상태·버튼 피드백, reduced-motion 준수.

##### Composition contract
- Hero archetype: asymmetrical. 왼쪽 54px 제목과 오른쪽 도시 사진을 하나의 넓은 배경으로 구성.
- First-viewport structure: 80px 헤더, 명확한 제목과 짧은 설명, 검색어/지역/검색 CTA 통합 폼. 다음 영역에 4개 주요 분야 타일과 나머지 분야 펼치기를 보여준다.
- Primary visual/proof artifact: 기존 seoul-city.jpg. 데이터 증거는 실제 API의 목록 수·기준일·출처만 사용.
- Interaction behavior: 검색→실제 목록 갱신, 분야→같은 검색 API, 상세→공식 상세 API, 저장→기존 localStorage, 준비→인증 API와 계정별 drafts, 공식 이동→검증된 기관 URL. 실제 접수 및 자격 판정으로 오인시키지 않는다.
- Reuse boundary: 한 서비스의 공통 토큰·셸·버튼·읽기 패널을 공유한다. 홈, 저장, 준비 현황, 설정은 별도 뷰이며 상세·준비실·맞춤·계정·비교·제보는 기존 dialog 생명주기를 유지한다.

##### Typography, color, layout
Pretendard 로컬 폰트. 기본 본문 18px/1.7, 작은 설명 16px/1.7, 카드 제목 22px/1.5, 페이지 제목 40px/1.4, 홈 제목 54px/1.35(모바일 32px). 글자 크기는 보통/크게/더 크게 3단계로 본문과 조작 요소를 함께 확대하며 별도 ansimlife.textSize 키를 사용한다. 배경 #f4f6f2, 본문 #1e3028, 보조 #55685d, 주 행동 #1b6b50, 어두운 표면 #15271e, 밝은 강조 #c4dfbb, 선 #dce4dc. 콘텐츠 1120px, 모바일 여백20px, 간격8/12/16/24/32/48/64px. 반경12–18px. 주요 버튼54px 이상, 보조44px 이상. 단순한 표면과 정보 위계로 통일한다.

##### 화면과 기능 계약
홈은 검색/모든 10개 분야/정렬/빠른 필터/검색 조건 저장·공유/추가 페이지를 유지한다. 저장한 혜택과 내 준비 현황은 독립 뷰로 제공하고 뒤로가기·메뉴 상태를 연결한다. 비로그인 준비 뷰는 계정 기록 안내와 로그인 행동을 제공한다. 설정은 글자 크기, 계정·맞춤·비교 바로가기, 기존 FAQ를 제공한다. 상세는 출처·대상·지원·조건·서류·문의·공식 링크와 공유·제보를 유지한다. 준비실은 3단계와 부분 체크/계정 저장/다음 확인일/일정 다운로드를 유지한다. 계정과 맞춤·비교·제보 화면도 같은 폰트와 간격으로 완성한다. 모바일은 4개 하단 메뉴, 스크롤 가능한 필터, 화면에 맞는 dialog와 safe area를 사용한다. 모든 화면의 loading/empty/error/success와 보이는 포커스를 유지한다.

##### Assets and implementation
기존 /prototype/assets/seoul-city.jpg를 공통 hero 자산으로 사용하고 출처 링크를 운영 footer에 표시한다. 장식 사진 alt는 빈 문자열, 조작 아이콘은 aria-hidden. 변경 경로: static/index.html, app.js, service.css, service-ui.js 및 필요 시 workspace.css/js. API 계약·인증·기존 저장키·데이터는 유지. 백엔드의 기존 미배포 고도화 변경도 테스트로 검증한다. 불필요한 스택 변경 없음.

##### Filled generation prompt
Create one high-concept production page system for 안심생활 공공혜택 탐색과 계정별 신청 준비.
Inputs: Topic=실제 공공혜택 검색·비교·준비; Offer=공식 정보를 이해하고 기관 신청을 준비하며 내 진행을 기록; Audience=전 연령 한국어 사용자; Primary user action=실제 혜택 검색; Deliverable=기존 HTML/CSS/JavaScript와 Spring API를 보존한 전체 서비스; Style direction=확정된 흑백 서울 사진·어두운 녹색 타일·밝은 정보 화면; Tonal key=홈 Dark와 읽기 Light; Icon policy=기존 SVG; Proof assets=기존 라이선스 사진과 실제 API 결과; Motion intensity=Minimal.
Design a clear, intentional and readable service with one dominant photographic hero and one coherent visual world. Headline is 나에게 필요한 혜택, 더 쉽게 찾아요. Supporting copy explains 생활에 필요한 지원 정보를 차근차근 확인해요. The primary CTA 혜택 찾기 submits searchForm to the existing API logic; the secondary action 내 상황으로 찾기 opens diagnosisDialog. Do not invent proof, user counts, testimonials, logos, eligibility or official submissions. Preserve all ten categories, search filters, saved search presets, bookmarks, comparisons, authentication, profiles, draft checklists, progress records, calendar export, detail sources and feedback. Use hierarchy, spacing and alignment before extra frames. Use readable Korean wrapping, min-width:0, semantic controls, visible keyboard focus, reduced-motion and comfortable touch areas. Keep home photographic and make every reading/form surface use the same light palette and type scale. Avoid gradients unrelated to photograph legibility, random decorations, tiny text and overlapping actions. Do not simplify functionality to match the prototype's five demo items. Output complete responsive production files with minimal dependencies.

##### Output target and verification
기존 /index.html, /service.css, /service-ui.js. 프로토타입은 비교용으로 그대로 보존.
JavaScript 구문·기존 JS 테스트·Maven test/package → H2 로컬 앱에서 검색/분야/빈 결과/상세/저장/비교/맞춤/로그인/프로필/부분 체크/재접속 복원/진행 기록/일정 → 360×800·390×844·768×1024·1440×900 및 큰 글씨·키보드 → 공개 전 비밀값·이력 점검 → upstream main push → 실제 fork 동기화와 전체 SHA 비교 → 기존 Coders 프로젝트 새 배포 terminal 상태 확인 → 운영 리소스 해시와 실제 API/모바일·PC 검증. 운영 데이터 훼손·삭제 없이 테스트 계정으로만 준비 흐름을 확인한다. 기존 사용자 기록과 운영 키를 출력하지 않는다.

운영 적용 검증(2026-10-25): Java 34개·JavaScript 7개 테스트와 Maven 패키징 통과. 최신 패키지에서 부분 체크·진행 상태·확인일 저장/재접속, 계정별 접근 차단, 잘못된 요청 후 기존 기록 보존 확인. 360·390·768·1440 화면과 작은 화면의 더 크게 글씨를 직접 검사. 모바일 정렬 축소, 비교 표 크기와 첫 열, 고정 비교 바로가기 여백, 어두운 패널 제목 대비, 홈 앵커·메뉴 전환, 전체 보기 초기화·저장 후 포커스를 보완했다. Enter/Space/Escape와 준비실 닫기 후 이어가기 버튼 포커스 복귀 확인. 운영 배포 후 실제 리소스·API·화면을 다시 검증한다.


#### Readability revision — 토스처럼 편하게 읽는 실제 서비스 (2026-10-25)

##### 요청과 근거
사용자는 배포된 사진·짙은 녹색 디자인보다 토스처럼 보기 편한 화면을 요청했다. 이번 범위는 같은 운영 서비스의 전체 UI 수정이다. 현재 홈은 518px 사진 영역과 4개 짙은 분야 타일, 반복된 맞춤 배너 및 검색 도구가 혜택 목록보다 먼저 나타난다. 분야 6개는 펼치기 안에 있고 로그인·준비실에는 어두운 보조 패널이 남아 있다. 실제 Spring API와 독립 뷰·모달 구조는 이미 연결돼 있으므로 유지한다. 이번 결정은 흰 화면에서 검색과 정보를 먼저 읽고 주요 행동만 파란색으로 강조하는 한 가지 방향이다.

##### Resolved inputs
- Topic: 안심생활 공공혜택 탐색·비교·신청 준비의 읽기 편한 전체 서비스.
- Offer: 공식 혜택을 찾고 저장·비교하며 계정에 준비 체크와 진행 기록을 이어가는 서비스.
- Audience: 청년부터 고령자까지 다양한 연령의 한국어 사용자.
- Primary user action: 검색어와 지역을 고르고 실제 혜택 결과를 찾는다.
- Deliverable: 기존 vanilla HTML/CSS/JavaScript와 Java/Spring API를 유지한 실제 서비스 전체 UI 수정 1개.
- Style direction: 밝고 단순한 한국어 제품 화면, 간결한 제목·부드러운 회색·주요 행동의 파란색·넉넉한 목록 간격.
- Tonal key: Light. 사진 배경과 어두운 정보 패널을 제거한다.
- Icon policy: 기존 자체 SVG 아이콘만 사용한다. 토스 로고·전용 폰트·보호된 이미지·화면을 복제하지 않는다.
- Proof assets: 실제 혜택 API·출처·기준일·계정 기록만 사용한다. 마케팅 사진과 가짜 지표는 사용하지 않는다.
- Motion intensity: Minimal. 조작 피드백과 reduced-motion 설정만 유지한다.

##### Composition contract
- Hero archetype: typography-led, asymmetrical left-aligned search introduction.
- First-viewport structure: 흰 헤더 72px, 왼쪽 제목 44px와 한 문장 설명, 회색 검색어/지역 폼과 파란 검색 버튼. 아래에 10개 짧은 분야 아이콘을 5열로 배치한다. 반복 맞춤 배너는 없애고 실제 혜택 목록의 시작을 당긴다.
- Primary visual/proof artifact: 사진 없이 실제 검색 컨트롤과 API 혜택 목록.
- Interaction behavior: 검색·지역·10개 분야는 기존 검색 함수와 API를 그대로 사용한다. 맞춤 조건은 기존 진단창, 저장·비교·준비·계정·제보도 기존 처리 함수를 유지한다. 검색 저장·공유는 펼침형 보조 도구에 배치하고 저장한 조건 수를 표시한다.
- Reuse boundary: 공통 색상·폰트·버튼·입력·읽기 표면을 모든 뷰/모달에 공유한다. 기존 라우팅과 데이터 계약은 유지하고 홈 정보 배치만 재구성한다.

##### 색상·글자·간격
색상 역할은 자체 서비스 토큰으로 정한다. 본문 #191f28, 보조 #6b7684, 배경 #f5f6f8, 표면 #ffffff, 입력·보조 영역 #f2f4f6, 선 #e5e8eb, 주요 행동 #3182f6, 선택 배경 #e8f3ff, hover #1b64da. 상태의 녹색·주황색은 의미를 구분할 때만 사용한다. Pretendard 로컬 폰트 유지. 본문 18px/1.75, 보조 16px/1.7, 분야 이름 15px/1.6(짧은 2~3음절), 카드 제목22px/1.5, 페이지 제목32px/1.45(모바일28px), 홈44px/1.35(모바일32px). 글자 크기 3단계 그대로 유지. 콘텐츠1080px, 모바일여백20px, 간격8/12/16/24/32/48px, 반경12~20px. 주요 버튼54px 이상, 보조44px 이상. 문장 줄바꿈 keep-all과 안전한 긴 문자열 줄바꿈을 유지한다.

##### 페이지별 구성
홈은 명확한 검색 소개, 모든 분야, 결과 제목·필터, 보조 검색 도구, 실제 혜택 카드 순서다. 저장과 준비 현황은 짧은 제목과 넉넉한 흰 목록으로 정리한다. 상세는 대상·지원·기준·서류·문의·공식 링크의 위계를 유지하며 제목과 색 면적을 줄인다. 준비실의 문맥 패널은 밝은 회색으로 바꾸고 실제 체크·단계·저장·진행상태·확인일·일정 기능을 보존한다. 로그인은 모바일에서 반복 마케팅 문구를 줄여 필드와 제출 버튼이 먼저 보이게 한다. 맞춤·비교·제보 제목을 짧게 하고 모든 폼을 같은 크기와 간격으로 정리한다. 설정도 같은 흰 표면·선택 색상을 사용한다. 빈 결과·로딩·오류·성공·키보드 포커스·모달 닫기/복귀를 유지한다.

##### 참고 자료
공식 https://www.tossbank.com/ 와 https://developers-apps-in-toss.toss.im/design/consumer-ux-guide 및 https://developers-apps-in-toss.toss.im/design/prepare/design 을 참고한다. 핵심 정보와 행동이 장식보다 먼저 읽히고 간격이 일관돼야 한다는 원칙을 적용한다. 여기서 선택한 픽셀값·색상은 안심생활의 자체 결정이며 TDS 공식 토큰이라고 주장하지 않는다. TDS 설치·스택 전환은 하지 않는다.

##### Filled generation prompt
Create one readable production page system for 안심생활 공공혜택 탐색과 신청 준비.
Inputs: Topic=전 연령의 공공혜택 발견·저장·비교·계정별 준비; Offer=공식 정보를 쉽게 이해하고 실제 기관 신청을 준비; Audience=다양한 연령의 한국어 사용자; Primary user action=혜택 검색; Deliverable=기존 HTML/CSS/JavaScript와 실제 Spring API 유지; Style direction=밝은 흰색 화면·간결한 제목·부드러운 회색 입력·파란 주요 행동·여유 있는 목록; Tonal key=Light; Icon policy=기존 자체 SVG; Proof assets=실제 API와 출처만; Motion intensity=Minimal.
Use a clear typography-led introduction with the headline 내게 맞는 혜택을, 쉽게 찾아보세요. Supporting copy is 지역과 생활 상황에 맞는 공공혜택을 한곳에서 확인해요. Primary CTA 혜택 찾기 submits the existing searchForm. Secondary CTA 내 상황으로 찾기 opens the existing diagnosisDialog. Remove the photographic hero and dark tiles. Show all ten categories with short visible labels and full accessible labels. Let results and actions have a clear reading order. Use restrained white and gray surfaces, deliberate whitespace, comfortable Korean typography and consistent form/close controls. Do not copy Toss assets or invent proof. Preserve search filters, pagination, saved searches, sharing, bookmarks, comparisons, recent history, login, profile, draft checklist, journey status, next date, calendar export, official details and feedback. Keep real loading/empty/error/success handling, touch areas, visible focus, Escape and focus return, reduced-motion and large text. Use no new framework or dependency.

##### Output target and validation
수정: static/index.html, service.css, app.js(분야 표시 및 중복 진입점 제거), workspace.js(저장 도구 표시), favicon.svg, README.md. API·인증·데이터·저장키 유지. 프로토타입은 역사적 참고 자료로 보존.
구문 검사·JavaScript 테스트·최소 패키징 → 실제 API 로컬 화면에서 검색·모든 분야·도구 펼치기·저장·비교·맞춤·계정·준비 기록 복원 → 360×800·390×844·768×1024·1440×900 및 큰 글씨·키보드·스크린샷 → 비밀값 검사 → 같은 서비스의 기존 배포 요청 범위에서 upstream/fork 동기화와 운영 재배포·검증. 검증되지 않은 접근성 도구·확대 결과를 완료로 주장하지 않는다.

구현 배치 보완: PC 1100px 이상은 10개 분야를 10열 한 줄로, 그 아래는 짧은 이름을 5열 두 줄로 표시한다. 검색 소개는 PC 한 줄 제목, 모바일 두 줄 제목으로 하고 반복 소개 라벨은 줄인다. 실제 보조 문장은 “정부·지자체 혜택을 한곳에서 확인해요.”, 맞춤 CTA는 “맞춤 찾기”, 지역 초기값은 “모든 지역”으로 간결하게 정리한다.

가독성 보완: 작은 글자 대비를 위해 주요 행동 파란색을 #246fe5, 작은 링크·선택 텍스트는 #1b64da, 보조 본문은 #626e7b로 조정한다. 흰 버튼 글자와 주요 배경의 계산 대비 및 연한 회색 위 보조 본문의 계산 대비를 확인한다. 공식 TDS 토큰이 아닌 자체 접근성 조정이다.


#### Variant 1 — 생활에서 시작하는 혜택 서비스 (2026-10-27)

모바일 준비 목록 실측 보완: 세 개의 확인 현황이 세로로 쌓여 기록을 밀어내므로 동일한 3열 요약으로 정리한다. 짧은 제목과 숫자는 위계를 분리하고 ‘지난 확인일 포함’·‘내가 정한 다음 확인일’·‘내가 기록한 보완 요청’ 보조 설명을 유지한다. 큰 글씨에서 칸이 좁아지면 자연스럽게 줄바꿈하며 본문을 잘라내지 않는다.

사용자 추가 피드백 반영: 기업 서비스처럼 일관된 타이포그래피가 핵심이다. 공식 wanteddev/wanted-sans 저장소에서 Wanted Sans Variable WOFF2를 고정 커밋으로 받아 로컬 제공하고 OFL을 포함한다. 본문·입력·내비게이션·제목·버튼은 Wanted Sans 한 계열로 통일하며 기존 Pretendard는 폴백으로 보존한다. 굵기는 본문400, 레이블500, 버튼600, 카드650, 제목700, 브랜드750을 기준으로 한다. 본문18px/1.75/-0.015em, 제목46px/1.3/-0.035em(모바일32px), 화면제목32px/1.4, 카드21px/1.5, 보조15px/1.7/0em. 숫자 카운트는 tabular-nums. 기존 글자 크기 설정은 상대 단위로 보존한다.
인쇄 창이 자동 검증을 막는 문제는 별도 공식 Apache PDFBox 3.0.8 서버 라이브러리와 Wanted Sans Regular/Bold TTF 임베딩으로 해결한다. 공식 상세 데이터를 기존 서비스에서 조회해 GET /api/programs/{id}/guide.pdf로 PDF를 직접 내려받는다. 브라우저 인쇄 호출 없이 미리보기의 PDF 버튼을 다운로드에 연결한다. 외부 입력 HTML·URL을 렌더링하지 않고 공식 공고의 텍스트·유효한 HTTP(S) 출처·조회일만 문서에 포함한다. 준비 메모·접수번호·계정 정보는 포함하지 않는다. 텍스트 줄바꿈·긴 URL·쪽 나눔·쪽 번호·글리프 폴백을 구현하고 실제 PDF를 렌더링해 검수한다. 스택·기존 엔드포인트 계약·DB는 유지하고 pom.xml에 필요한 라이브러리만 추가한다.

시각 검증 후 배치 보완: 상황별 6개와 분야별 10개를 모두 펼치면 첫 결과가 화면 아래로 밀린다. 전체 분야는 기본 접힘 네이티브 details/summary로 제공하고 10개 분야를 한 번에 펼친다. 첫 화면은 검색과 상황 탐색, 결과의 시작에 집중한다. PC 장식은240px로 줄여 제목·검색과 경쟁하지 않게 한다.

##### 목적·근거·문제
현재 실제 서비스는 10개 분야 검색과 계정별 준비 기록을 제공한다. index.html의 긴 첫 화면과 app.js programCard의 원문 전체 본문은 실제 공고가 길 때 카드 높이를 크게 만든다. 저장한 목록에는 검색·정렬이 없어 다시 찾기가 어렵다. 검색어를 모르는 사람은 분야를 선택해도 방대한 공고 앞에서 다시 막힌다. 기존 밝은 파란 브랜드·Pretendard·API·인증·기록은 보존한다.

##### Resolved inputs
- Topic: 안심생활 — 생활 상황에서 시작하는 공공혜택 탐색과 신청 준비
- Offer: 정부·지자체 공고를 상황별로 찾고 저장·비교한 뒤 공식 신청을 준비
- Audience: 검색어와 행정 용어에 익숙하지 않은 성인을 포함한 전 연령 한국어 사용자
- Primary user action: 혜택 찾기: 기존 searchForm을 제출하거나 상황별 모아보기를 선택
- Deliverable: 기존 Spring Boot API와 vanilla HTML/CSS/JavaScript 실제 서비스
- Style direction: Airy Korean product: 흰색·연한 파랑, 단정한 목록, 자체 종이 안내문 일러스트
- Tonal key: Light
- Icon policy: 기존 SVG 아이콘과 자체 제작한 장식용 SVG 한 개
- Proof assets: 실제 API 혜택·기준 시각·공식 출처, 가상 실적이나 리뷰 없음
- Motion intensity: Minimal: 조작 피드백만, reduced-motion 존중

##### Composition contract
- Hero archetype: asymmetrical. 좌측에 ‘생활에 필요한 혜택, 찾는 일부터 쉽게.’ 제목과 짧은 설명, 우측에는 자체 제작한 종이 안내문·책갈피 SVG 한 개. 통계·가짜 제품 화면을 그리지 않는다.
- First-viewport structure: 흰 헤더 → 간결한 제목과 통합 검색 → 상황별 모아보기 가로 행 → 분야 탐색. PC는 결과 시작이 함께 보이고 모바일에서는 장식 SVG를 생략해 조작을 앞당긴다.
- Primary visual/proof artifact: 장식용 안내문 SVG, 결과의 증거는 실제 API 공고와 공식 출처만.
- Interaction behavior: 기존 검색 제출과 맞춤 조건을 유지. 상황 선택은 서버의 명시적 topic 코드로 여러 관련 단어를 함께 검색하고 지역·키워드와 AND 결합. URL 공유·검색 저장에도 topic을 보존. 자격 판정으로 표현하지 않는다.
- Reuse boundary: 기존 서비스의 레이아웃·인증·API·데이터 계약을 확장하며 새 프레임워크로 이전하지 않는다. 공고 목록·저장·준비는 실제 제품 화면이므로 랜딩 전용 카드 금지 규칙보다 기능과 가독성을 우선한다.

##### 디자인 시스템·페이지 구성
본문 #202b3d, 보조 #657187, 파랑 #246fe5/hover #1b64da, 표면 #fff, 페이지 #f6f8fb, 선 #e7ecf3. 기존 토큰은 재사용하고 신규 토큰은 product.css에 역할별로 선언한다. Pretendard 유지, 본문18px/1.7, 보조16px/1.7, 카드 제목20px/1.5, 홈44px/1.35(모바일30px). 콘텐츠1160px, 모바일20px, 간격8·12·16·24·32·48px, 반경12·18·24px, 주요 높이52px·보조44px.
홈의 상황별 행은 주거·이사, 취업·창업, 육아·출산, 배움·장학, 건강·돌봄, 문화·여가 여섯 가지다. 행은 모바일에서 가로 스크롤하며 다음 항목 힌트를 보인다. 분야는 모두 노출한다. 결과는 2열 카드 대신 한 줄 흐름의 넓은 목록: 분야·지역, 제목, 지원 설명과 대상의 요약, 기한·저장·비교. 원문 전체는 상세에서 제공한다. 긴 본문은 명시적 미리보기이며 상세 진입 표시를 제공한다.
저장 화면은 제목 검색·마감 가까운순·저장순, 결과 수·초기화·빈 결과를 추가한다. 상세는 기존 모든 정보·출처를 유지하고 인쇄/PDF 저장을 추가한다. 인쇄는 현재 상세만 읽기 좋은 문서로 출력하며 브라우저의 인쇄 기능으로 PDF 저장한다. 개인 계정·준비 메모·접수번호는 출력하지 않는다. 인쇄용 공식 URL과 조회일을 분명하게 표시한다. 로그인·맞춤·제보·비교·3단계 준비·설정도 같은 폰트·버튼·표면·제목 간격을 사용한다.

##### 자산·접근성·기능 계약
새 외부 플러그인·폰트·API 키가 필요하지 않다. 자체 SVG는 alt 빈 문자열의 장식으로 사용한다. 토스·SEED의 보호된 자산은 쓰지 않는다. 참고: https://www.tossbank.com/ , https://seed-design.io/foundations , https://www.tasteskill.dev/ . 핵심 정보 위계·일관된 역할·콘텐츠 고유성을 참고하고 수치·토큰은 자체 결정이다.
상황별 검색은 한정된 코드·단어 목록, 서버 검증과 페이지 분할 전에 필터링. 기존 keyword·region·category·age·household·filter·sort·hideClosed·page 계약 유지. 기존 저장키·계정별 준비 기록과 로그인·체크·캘린더·공식 링크·제보 유지. loading·empty·error·success와 요청 취소 유지. keep-all, min-width:0, 긴 URL 줄바꿈, 포커스·Escape 복귀·44px 조작·reduced-motion·큰 글씨를 확인한다.

##### 실제 수정 경로와 검증
static/index.html, app.js, workspace.js, workflow-core.js, 신규 product.css·product.js·benefit-guide.svg, support/BenefitTopic.java·SupportProgramController.java, 해당 Java/JS 테스트, README.md. design.md 선행 완료 후 구현한다.
Java API 테스트로 topic의 OR·지역 AND·지원하지 않는 값 거부·필터 후 총수/페이지 정렬을 검증. JS는 공유·정규화·주제 보존과 저장목록 선택을 검증. Maven test/package와 JS 구문·회귀 테스트, 실제 브라우저의 상황 선택→저장/공유→상세→인쇄 준비·저장 검색 흐름을 확인한다. 360×800·390×844·768×1024·1440×900, 큰 글씨, Tab·Enter·Space·Escape와 콘솔을 확인한다. 기존 배포 요청 범위에서 안전 검사 후 canonical → 실제 fork 동기화 → 기존 Coders 프로젝트 배포 → 운영 확인한다. 측정하지 않은 이용자 증가를 주장하지 않는다.

##### Output target
- Path: src/main/resources/static/index.html (실제 서비스와 연결된 공통 화면)

##### Filled generation prompt
Create one high-concept page for 안심생활 — 생활 상황에서 시작하는 공공혜택 탐색과 신청 준비.

#### Inputs
- Topic: 안심생활 — 생활 상황에서 시작하는 공공혜택 탐색과 신청 준비.
- Offer: 정부·지자체 공고를 상황별로 찾고 저장·비교한 뒤 공식 신청을 준비
- Audience: 검색어와 행정 용어에 익숙하지 않은 성인을 포함한 전 연령 한국어 사용자
- Primary user action: 혜택 찾기: 기존 searchForm을 제출하거나 상황별 모아보기를 선택
- Deliverable: 기존 Spring Boot API와 vanilla HTML/CSS/JavaScript 실제 서비스
- Style direction: Airy Korean product: 흰색·연한 파랑, 단정한 목록, 자체 종이 안내문 일러스트
- Tonal key: Light
- Icon policy: 기존 SVG 아이콘과 자체 제작한 장식용 SVG 한 개
- Proof assets: 실제 API 혜택·기준 시각·공식 출처, 가상 실적이나 리뷰 없음
- Motion intensity: Minimal: 조작 피드백만, reduced-motion 존중

#### Objective
Design one premium, memorable page with a dominant hero and one coherent visual world derived from the topic itself.
The result should feel specific, intentional, and action-oriented when the concept calls for action, not like a generic startup or SaaS template.

Choose the strongest clear solution.
Do not collapse the concept into a simpler generic pattern just to make execution easier.

- Treat single-file execution as a packaging constraint, not a creative constraint.
Do not reduce conceptual ambition, visual specificity, interaction richness, or production quality merely because the deliverable is concise.

#### Internal concept choice
Before composing, decide internally:
- one dominant hero archetype: centered / asymmetrical / immersive
- one dominant proof mode: none / embedded gesture / single artifact
- one palette driver derived from the topic
- one tonal key: light / mid / dark / topic-derived
- one motion role: none / minimal / ambient / interactive
- one icon approach: none / minimal / expressive / topic-native
- optionally one secondary accent only if it strengthens the main direction without creating a second visual world
Do not output this planning.

#### Non-negotiables
- Use a strong hero-first composition.
- Headline: 3-12 words, max 3 lines.
- Supporting copy: 1-2 short sentences, concise and specific.
- CTAs are optional. If used, include at most 1 primary and 1 secondary CTA.
- If a clear next step is central to the offer or concept, include a CTA; otherwise CTA omission is allowed.
- CTA labels must be specific to the offer and action, not generic.
- Supporting highlights are optional. If used, show them only once in a single lower support cluster beneath the hero.
- Keep the hero dominant, focused, readable, and uncluttered.
- Proof is optional. Use it only if it clearly strengthens the concept.
- If no real proof assets are provided, do not invent metrics, testimonials, customer logos, screenshots, or fake UI proof.
- Prefer depth inside the hero, proof gesture, CTA behavior, support copy, or background logic rather than adding extra sections by default.

#### Composition
- Choose the clearest structure for the topic; do not default to generic two-column marketing layouts.
- A top navigation bar is optional. When used, make it native to the chosen style direction and subordinate to the hero rather than a generic boxed header.
- The hero may be fully integrated rather than framed.
- The hero does not need to become a panel, dashboard, device mockup, rounded card, or floating showcase unless the topic genuinely demands that artifact.
- Build hierarchy through scale, contrast, spacing, alignment, depth, rhythm, and composition before using frames, dividers, or containers.
- Keep supporting content clearly subordinate to the hero.
- Do not interpret structural restraint as permission to flatten the concept into a generic minimal layout.
- Do not use text-on-text layering, typographic collisions, or overlapping live text as a compositional device.

#### Visual system
- Build one coherent visual world derived from the topic itself.
- Let the topic drive palette, contrast, typography, spacing, geometry, motifs, materials, and motion.
- Even restrained palettes must feel intentional and specific, not generic premium-neutral.
- The background must actively contribute mood, depth, and topic logic.
- If the topic suggests a real system language, physical behavior, or interface grammar, show that directly instead of generic abstract-tech decoration.
- Treat headline typography as part of the concept, not neutral text.
- The headline may use topic-derived color, selective emphasis, multi-tone treatment, or gradient accents when they strengthen the concept and remain readable.
- Do not default the headline to neutral black, white, or near-white unless that is clearly the strongest topic-native choice.

#### Background and tonal diversity
- Premium and atmospheric design may be light, mid-tone, or dark; do not default to dark.
- Choose the tonal key from the topic, offer, audience, and style direction rather than from generic cinematic or tech aesthetics.
- Contrast may come from hue, saturation, temperature, texture, density, or scale, not only darkness.

#### Proof and concept expression
- Prefer the minimum visual evidence needed to make the idea feel specific, credible, and native to the topic.
- If the concept is strongest with typography, atmosphere, and one precise gesture, do that.
- If a stronger proof artifact is justified, use one legible, unified artifact rather than multiple fragmented panels.
- Proof may take the form of a signal, trace, contour, command line, path, specimen, structural mark, scene fragment, or other topic-native evidence.
- Typography itself may carry part of the concept or proof.
- When appropriate, use one precise typographic gesture—such as selective word emphasis, chromatic offset, gradient emphasis, distortion, signal breakup, or structural interruption—to make the concept feel more specific and alive.
- Prefer one strong typographic intervention over many scattered decorative effects.
- Avoid decorative pseudo-proof.
- Avoid turning simple ideas into framed showcases, dashboard fragments, floating panels, softened slabs, or generic marketing geometry.

#### Icons and symbolic language
- Icons are optional.
- Use icons only when they improve scanability, recognition, navigation, proof clarity, or support-cluster legibility.
- Prefer topic-native icon logic over generic startup glyphs.
- Keep icon style consistent in stroke weight, geometry, corner logic, and detail level.
- Use icons primarily in clearly secondary roles unless a single topic-native symbol is central to the concept.
- Do not let icons compete with the hero headline, proof artifact, or CTA hierarchy.

#### Support cluster
- If used, show supporting highlights only once, in a single lower cluster beneath the hero.
- Each highlight should be short, fast to scan, and clearly secondary.
- Supporting highlights may use concise icons or symbolic marks when helpful.
- Support-cluster elements may use subtle motion when it improves scanability, continuity, or atmosphere and remains clearly secondary.
- Card-like grouping is allowed only inside this lower support cluster.
- These modules may use at most one light surface treatment, such as a subtle stroke, tonal fill, or very soft shadow.
- Keep support modules uniform, non-nested, and visually subordinate.
- Do not use card-like structures in the hero, proof, CTA area, or elsewhere on the page.

#### Motion
- Motion is optional.
- Use motion only when it supports hierarchy, continuity, feedback, atmosphere, or topic logic.
- Default to none, minimal, or ambient motion depending on what the concept actually needs.
- Motion may live in typography, background behavior, proof logic, support-cluster behavior, or interaction feedback.
- A single key word or short phrase may use subtle text-based motion such as glitch, flicker, jitter, scanline shift, chromatic split, text scramble, pulse, or reveal if it strengthens the concept.
- Keep motion controlled, readable, non-blocking, and subordinate to clarity.
- Avoid scrolljacking, attention-hijacking loops, and ornamental animation.
- Respect reduced-motion preferences.

#### Accessibility and readability
- Preserve strong readability and clear hierarchy at all viewport sizes.
- Maintain sufficient contrast between text and background.
- Do not place essential text over busy imagery unless readability remains strong.
- Avoid cramped spacing, visual collisions, and weak focal hierarchy.
- Do not place badges, pills, annotations, stickers, or floating interface fragments over essential text.
- If the deliverable is code, use semantic HTML structure, visible focus states, keyboard-friendly interactions, and reduced-motion handling.
- When in doubt, preserve legibility over expressive overlap.

#### Anti-drift rules
- Do not drift into bland corporate SaaS styling.
- Do not default to dashboard aesthetics, feature-grid thinking, boxed-section composition, or template-like modularity.
- Do not use disconnected motifs, random color choices, or interchangeable abstract-tech shapes.
- Do not use card-within-card composition, nested surfaces, floating panels, fake proof, or stock-looking UI.
- Keep one visual world, one dominant hero, and one clear structural logic.
- Do not allow text, labels, or interface elements to overlap, collide, or sit on top of one another.

#### Output
Return only the final 기존 Spring Boot API와 vanilla HTML/CSS/JavaScript 실제 서비스.

If the deliverable is code:
- Output a complete production-ready file or component.
- Keep dependencies minimal unless explicitly requested.
- Make it responsive.
- Keep support highlights in one lower support cluster only when used.

#### Final self-check
Before returning, verify that the result keeps:
- one dominant hero
- one coherent visual world
- no invented proof
- no cardification outside the lower support cluster
- no generic SaaS drift
- no unnecessary structural fragmentation
- no nested containment
- no floating sub-surfaces
- all text clearly legible and comfortably spaced

준비·설정 화면에서는 고정 비교 바로가기를 숨겨 본래 작업을 가리지 않게 한다. 비교 목록은 유지하고 탐색·저장 화면과 설정의 명시적 비교 버튼에서 계속 접근할 수 있다.

운영 전환에서 PDF 폰트 누락으로 새 서버가 기동하지 못한 것을 확인했다. 배포 단계에서 공식 고정 커밋의 폰트를 필요할 때 복원하고 SHA-256을 검사한다. JAR 내 세 폰트 검사에서는 CI와 Coders의 포함 결과가 달랐다. 기존 정상 서비스는 새 서버 준비까지 유지한다.

Coders 빌드에서 JAR 리소스가 CI와 다르게 포함되는 점이 확인돼 최종 배포는 폰트를 컨테이너에 명시적으로 복사한다. PDF는 `/app/pdf-fonts`의 비공개 파일, 웹은 기존 `/app/public`의 파일을 사용하며 로컬 실행은 classpath 폰트를 유지한다. CI는 실제 완성 컨테이너의 기동·웹 폰트 SHA-256·PDF 응답까지 검증한다.

운영에서 주입되는 후원 위젯은 위치를 높여도 분야 탐색을 가리는 점을 확인했다. 1100px 이하에서는 페이지 맨 아래의 일반 영역으로 배치하고, 끝까지 스크롤했을 때도 고정 비교·하단 메뉴와 겹치지 않도록 아래 여백을 둔다. 후원 기능과 준비·설정 화면의 비교 바로가기 숨김 동작을 유지한다.

</details>

공식 API 연동 검증: 비공개 환경변수 등록 전 목록·상세 모두 HTTP 200을 확인했다. 로컬 전체 동기화 READY와 실제 제출서류·조회 시각·1분 재조회 제한을 확인했다. 운영 완료 건수는 배포 후 별도로 검증한다.

</details>

</details>

</details>
