# OpenUI Design Plan

## Variant 1

### Resolved inputs
- Topic: 안심생활 공공혜택 탐색
- Offer: 공식 공공혜택을 검색하고 내 조건을 좁혀 신청 준비·개인 진행기록 관리
- Audience: 생활비·주거·일자리 등의 지원을 찾는 사용자
- Primary user action: diagnosisOpen으로 맞춤 조건 설정; searchForm으로 실제 혜택 검색
- Deliverable: 기존 프로젝트의 실제 홈페이지·컴포넌트와 스타일; 기술 스택 유지
- Style direction: 밝고 든든한 녹색 생활 서비스
- Tonal key: 기존 제품의 실제 브랜드와 사용 환경에 맞춤
- Icon policy: 기존 아이콘·자산 유지; 새 장식 아이콘 불필요
- Proof assets: 기존의 실제 자산·데이터만 보존; 새로운 증거·성과·후기는 없음
- Motion intensity: Minimal; 기능 이해와 피드백만, reduced-motion 존중

### Composition contract
- Hero archetype: asymmetrical
- First-viewport structure: 히어로를 짧게 유지해 첫 화면에 검색이 보이도록 하고 공공혜택이라는 목적을 제목에서 명시한다. 기존 봉투 일러스트와 실제 검색·상세·준비실 연결을 보존한다. 모바일은 제목→맞춤 조건→검색 순서이며 예시 수치와 공식 제출 주장은 추가하지 않는다.
- Primary visual/proof artifact: 현재 제품의 실제 인터페이스·제공된 자산 또는 타이포그래피; 임의 지표 없음
- Interaction behavior: diagnosisOpen으로 맞춤 조건 설정; searchForm으로 실제 혜택 검색
- Reuse boundary: 현재 라우트·상태·폼·인증·API·실제 데이터 구조를 유지하고 output target의 화면 표현만 수정

### 서비스와 코드 근거
히어로를 짧게 유지해 첫 화면에 검색이 보이도록 하고 공공혜택이라는 목적을 제목에서 명시한다. 기존 봉투 일러스트와 실제 검색·상세·준비실 연결을 보존한다. 모바일은 제목→맞춤 조건→검색 순서이며 예시 수치와 공식 제출 주장은 추가하지 않는다.

### 디자인 기준과 구현 범위
기존 app.css의 녹색·크림 토큰, 제목 36~44px, 본문 16~18px, 검색 입력 48px. 간격8·12·16·24·32·48·64px를 기존 리듬에 맞춰 쓰고 모바일 좌우20px, PC 콘텐츠 폭1120~1440px를 유지한다. 유연한 자식 min-width:0, 긴 한국어 keep-all과 안전한 overflow-wrap, 명확한 focus-visible, 링크·폼 레이블, 모바일 safe area를 확인한다. 프로젝트에 이미 있는 구체적인 토큰을 우선하며 모든 서비스를 같은 템플릿으로 만들지 않는다.

### 실행과 검증 계획
기존 패키지 스크립트의 빌드·타입·핵심 테스트를 실행한다. 앱을 띄워 1440×900, 768×1024, 390×844, 360×800의 실제 브라우저 화면을 확인하고 버튼·탭·라우팅·키보드 포커스·가로 넘침·오류 상태를 점검한다. 실제 API·OAuth·기기·데이터 접근이 없는 검증은 미확인으로 기록하고 가짜 응답으로 성공을 주장하지 않는다.

### Filled generation prompt

Create one high-concept page for 안심생활 공공혜택 탐색.

#### Inputs
- Topic: 안심생활 공공혜택 탐색.
- Offer: 공식 공공혜택을 검색하고 내 조건을 좁혀 신청 준비·개인 진행기록 관리
- Audience: 생활비·주거·일자리 등의 지원을 찾는 사용자
- Primary user action: diagnosisOpen으로 맞춤 조건 설정; searchForm으로 실제 혜택 검색
- Deliverable: 기존 프로젝트의 실제 홈페이지·컴포넌트와 스타일; 기술 스택 유지
- Style direction: 밝고 든든한 녹색 생활 서비스
- Tonal key: 기존 제품의 실제 브랜드와 사용 환경에 맞춤
- Icon policy: 기존 아이콘·자산 유지; 새 장식 아이콘 불필요
- Proof assets: 기존의 실제 자산·데이터만 보존; 새로운 증거·성과·후기는 없음
- Motion intensity: Minimal; 기능 이해와 피드백만, reduced-motion 존중

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
Return only the final 기존 프로젝트의 실제 홈페이지·컴포넌트와 스타일; 기술 스택 유지.

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


### Output target
- Path: src/main/resources/static/index.html
- Path: src/main/resources/static/app.css
