# 안심생활

> 전국의 정부·지자체·공공기관 혜택을 찾고, 신청 준비부터 공식 접수 이후 결과까지 관리하는 공공혜택 신청 내비게이터

[안심생활 바로가기](https://ansimlife.coders.kr)

저장소는 개인 원본과 조직 Fork로 운영합니다.

- 원본(Upstream): [boclair98/ansimlife](https://github.com/boclair98/ansimlife)
- 조직 Fork: [coders-kr/ansimlife](https://github.com/coders-kr/ansimlife)

기능 개발은 원본 `main`에 먼저 반영하고, 검증된 커밋을 조직 Fork에 동기화합니다.

안심생활은 공공혜택 목록을 보여주는 데서 끝나지 않습니다. 사용자가 자신의 상황에 맞는 혜택 후보를 좁히고, 공식 지원대상과 준비서류를 확인하고, 정확한 공식 접수처로 이동하고, 신청 이후 상태와 다음 확인일까지 관리할 수 있도록 돕습니다. 신청서에 들어갈 이름·전화번호·주소·정확한 소득·재산정보·증빙파일은 수집하지 않습니다.

이 프로젝트는 Java 21, Spring Boot, Spring Data JPA, PostgreSQL과 프레임워크 없는 HTML/CSS/JavaScript로 작성했습니다.

## 가장 중요한 서비스 원칙

안심생활은 기관과 연결되지 않은 신청을 실제 접수된 것처럼 표시하지 않습니다.

- 공공데이터 API는 혜택 목록과 상세정보 조회에 사용합니다.
- 모든 혜택의 최종 제출은 공식 사이트 또는 방문·전화 등 해당 기관이 안내하는 방식으로 진행합니다.
- 안심생활은 신청용 개인정보와 증빙파일을 수집하거나 기관에 전송하지 않습니다.
- 사용자가 `공식 사이트에서 신청함`이라고 기록한 상태는 사용자 메모로 저장합니다.
- 최종 지원 자격과 선정 결과는 담당기관이 확정합니다.

이 구분은 화면 문구뿐 아니라 백엔드 데이터와 API에서도 분리되어 있습니다.

| 구분 | 의미 | 기관이 확인한 접수인가? |
| --- | --- | --- |
| 혜택 준비 | 조건 확인 여부와 서류 체크상태를 안심생활에 저장 | 아니요 |
| 사용자 진행기록 | 사용자가 공식 사이트 방문, 신청, 보완, 결과를 직접 기록 | 아니요 |
| 공식 접수 | 사용자가 연결된 정부·기관 화면에서 직접 제출 | 공식 기관에서만 확인 |

## 주요 기능

### 1. 전체 공공혜택 탐색

- 중앙부처·지자체·공공기관의 약 1.1만 개 혜택 동기화
- 키워드, 지역, 분야 조합 검색
- 10개 생활 분야 탐색
- 페이지 단위 추가 로딩
- 동기화 중에도 PostgreSQL에 마지막으로 저장된 정보 제공

### 2. 민감정보 없는 맞춤진단

- 거주 지역
- 연령대
- 선택형 소득 구간(선택사항)
- 가장 필요한 도움 분야
- 현재 가구 상황

진단 결과는 자격 확정이 아니라 먼저 확인할 혜택 후보를 좁히는 용도입니다. 주민등록번호와 정확한 소득·재산정보를 요구하지 않습니다. 로그인한 사용자는 선택한 조건을 서버에 저장해 다른 기기에서도 이어갈 수 있습니다.

서버는 혜택의 지원대상 문구를 연령대·가구 조건과 비교해 각 항목에 다음 판정값을 함께 내려줍니다.

- `MATCHED`: 선택한 연령대 또는 가구 조건과 명시적으로 일치하는 후보
- `GENERAL`: 특정 대상 제한이 없어 추가 확인이 필요한 공통 혜택
- `EXCLUDED`: 선택 조건과 충돌하는 전용 혜택으로 검색 결과에서 제외

따라서 청년을 선택했을 때 노인 전용 혜택이 추천 배지로 표시되지 않습니다. 단, 자연어로 작성된 원문 대상 문구를 해석하는 보조 필터이므로 최종 자격은 반드시 공식 공고와 담당기관에서 확인해야 합니다.

### 2-1. 로그인 사용자 맞춤 조건 저장

맞춤진단을 로그인 상태에서 제출하면 지역·연령대·가구 상황·관심 분야·선택형 소득 구간이 `user_profiles` 테이블에 사용자별로 저장됩니다. 계정 화면에서 저장 시각을 확인하거나 `내 조건 수정`으로 다시 진단할 수 있습니다. 이름, 전화번호, 주민등록번호, 계좌번호, 증빙 원본은 저장하지 않습니다.

### 3. 공식 상세정보 화면

혜택 카드를 누르면 공공데이터 상세 API를 호출해 다음 정보를 보여줍니다.

- 사업 목적과 주요 내용
- 지원 대상
- 지원 내용
- 선정 기준
- 신청 기간과 신청 방법
- 소관기관, 접수기관, 담당부서, 문의처
- 사용자가 제출할 서류
- 담당공무원이 확인하는 서류
- 본인 동의로 확인하는 서류
- 공식 신청 URL
- 법적 근거와 원본 수정일

상세 응답은 메모리에 6시간 캐시하며, 외부 API가 실패하면 데이터베이스에 저장된 정보로 안전하게 대체합니다.

### 4. 혜택별 신청 준비실

각 혜택마다 독립적인 3단계 준비 화면을 제공합니다.

1. `조건·서류`: 지원대상, 선정기준, 공식 준비서류와 체크리스트 확인
2. `공식 접수처`: 준비도 확인, 신청 방식 안내, 전화 문의 문장 복사, 공식 접수처 이동
3. `결과관리`: 내가 기록한 진행상태, 접수번호 메모, 다음 확인일 저장

신청 준비실은 이름, 연락처, 출생연도, 상세주소, 소득·재산정보, 주민등록번호, 계좌정보와 증빙 원본을 받지 않습니다.

### 5. 신청 여정 관리

사용자는 공식 신청 이후 다음 상태를 기록할 수 있습니다.

| 상태 코드 | 화면 표시 | 설명 |
| --- | --- | --- |
| `PREPARING` | 혜택 준비 중 | 조건·서류 확인 단계 |
| `OFFICIAL_SITE_OPENED` | 공식 신청처 확인 | 공식 접수 화면을 열어본 상태 |
| `USER_REPORTED_SUBMITTED` | 내가 신청했다고 기록 | 사용자가 외부 접수를 완료했다고 기록 |
| `SUPPLEMENT_REQUESTED` | 보완 요청 받음 | 담당기관에서 추가 자료를 요청한 상태 |
| `RESULT_WAITING` | 결과 기다리는 중 | 접수 후 심사 또는 결과 대기 |
| `APPROVED` | 선정됐다고 기록 | 사용자가 선정 결과를 기록 |
| `REJECTED` | 미선정으로 기록 | 사용자가 미선정 결과를 기록 |
진행상태는 모두 사용자가 관리하는 기록이며 기관이 확인한 접수 증명이 아닙니다.

### 6. 로그인과 개인화

- 별도 이메일 회원가입·로그인
- BCrypt 비밀번호 해시
- JDBC 기반 서버 세션
- 관심 혜택 브라우저 저장
- 로그인 계정에 맞춤 조건 저장 및 기기 간 복원
- 사용자별 조건·서류 체크와 진행상태 저장
- 혜택은 한눈에 훑는 목록으로 제공하고, 항목을 누르면 지원대상·혜택·서류·신청방법 전체를 상세 화면에서 확인
- 목록에는 긴 원문을 억지로 잘라 넣지 않고 제목·요약·지역·신청방식·기간만 우선 표시
- 모바일·데스크톱 반응형 UI
- 데이터 상태와 마지막 동기화 시각을 화면에서 확인
- 모바일 360px부터 데스크톱 1440px까지 글자·버튼 겹침과 가로 넘침 방지

## 사용자 흐름

```mermaid
flowchart LR
    A[5분 맞춤진단] --> B[혜택 후보]
    B --> C[공식 상세 확인]
    C --> D[조건·서류 체크]
    D --> E[공식 접수처 이동]
    E --> F[공식 기관에서 직접 신청]
    F --> G[접수·보완·결과 상태 기록]
```

## 기술 구성

| 영역 | 기술 |
| --- | --- |
| 언어 | Java 21 |
| 애플리케이션 | Spring Boot 3.4.2 |
| 웹 API | Spring MVC |
| ORM | Spring Data JPA / Hibernate |
| 로그인 | 자체 이메일 계정, BCrypt, Spring Session JDBC |
| 운영 DB | PostgreSQL |
| 로컬 DB | H2 in-memory, PostgreSQL 호환 모드 |
| 프런트엔드 | Semantic HTML, CSS, Vanilla JavaScript |
| 외부 데이터 | 공공데이터포털 대한민국 공공서비스(혜택) Open API |
| 배포 | Docker, Coders |

## 프로젝트 구조

```text
.
├─ src/main/java/kr/coders/ansimlife
│  ├─ account
│  │  ├─ AuthController.java
│  │  ├─ PasswordConfig.java
│  │  ├─ UserAccount.java
│  │  ├─ UserAccountRepository.java
│  │  ├─ UserProfile.java
│  │  ├─ UserProfileController.java
│  │  └─ UserProfileRepository.java
│  ├─ application
│  │  ├─ ApplicationDraft.java
│  │  ├─ ApplicationDraftController.java
│  │  ├─ ApplicationSubmissionService.java
│  │  ├─ BenefitApplicationConnector.java
│  │  ├─ ApplicationConnectorRegistry.java
│  │  └─ ApplicationChannel.java
│  ├─ support
│  │  ├─ SupportProgram.java
│  │  ├─ SupportProgramController.java
│  │  ├─ PublicServiceSyncService.java
│  │  └─ PublicServiceDetailService.java
│  └─ system
│     └─ HealthController.java
├─ src/main/resources
│  ├─ static
│  │  ├─ index.html
│  │  ├─ app.css
│  │  └─ app.js
│  └─ application.properties
├─ src/test/java
├─ coders.yaml
├─ Dockerfile
└─ pom.xml
```

## 로컬 실행

### 준비물

- JDK 21
- Maven 3.9 이상
- 선택사항: PostgreSQL 15 이상

### 1. 저장소 받기

```bash
git clone https://github.com/boclair98/ansimlife.git
cd ansimlife
```

### 2. 환경변수 설정

공공데이터 없이도 대표 샘플 데이터로 실행할 수 있습니다. 전체 혜택을 동기화하려면 `DATA_GO_KR_SERVICE_KEY`를 설정합니다.

PowerShell:

```powershell
$env:DATA_GO_KR_SERVICE_KEY="발급받은-일반인증키"
mvn spring-boot:run
```

macOS/Linux:

```bash
export DATA_GO_KR_SERVICE_KEY="발급받은-일반인증키"
mvn spring-boot:run
```

브라우저에서 `http://localhost:8080`을 엽니다.

### 3. 기본 H2 실행 방식

별도 데이터베이스 환경변수를 설정하지 않으면 아래 H2 인메모리 데이터베이스를 사용합니다.

```properties
spring.datasource.url=jdbc:h2:mem:ansimlife;MODE=PostgreSQL;DB_CLOSE_DELAY=-1
spring.jpa.hibernate.ddl-auto=create-drop
```

애플리케이션을 종료하면 H2 데이터는 사라집니다.

## PostgreSQL 실행

다음 환경변수를 설정하면 PostgreSQL을 사용할 수 있습니다.

```bash
SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/ansimlife
SPRING_DATASOURCE_USERNAME=ansimlife
SPRING_DATASOURCE_PASSWORD=change-me
SPRING_JPA_HIBERNATE_DDL_AUTO=update
SPRING_JPA_DATABASE_PLATFORM=org.hibernate.dialect.PostgreSQLDialect
SESSION_COOKIE_SECURE=false
DATA_GO_KR_SERVICE_KEY=your-service-key
```

운영 환경에서는 `SESSION_COOKIE_SECURE=true`를 사용하고 HTTPS 뒤에서 실행해야 합니다.

## 공공데이터 API 키 발급

사용 데이터셋: [행정안전부 대한민국 공공서비스(혜택) 정보](https://www.data.go.kr/data/15113968/openapi.do)

1. 공공데이터포털에 로그인합니다.
2. 데이터셋 페이지에서 활용신청을 누릅니다.
3. 개발계정 승인을 확인합니다.
4. 마이페이지에서 일반 인증키를 확인합니다.
5. 인증키를 `DATA_GO_KR_SERVICE_KEY` 환경변수로 설정합니다.

주의사항:

- 인증키를 `application.properties`, JavaScript, Git 커밋에 직접 넣지 마세요.
- URL 인코딩된 키와 디코딩된 키를 중복 인코딩하지 않도록 주의하세요.
- 이 키는 혜택 목록·상세정보 조회 권한입니다.
- 정부혜택 신청 접수 권한이나 사용자 행정정보 조회 권한은 포함하지 않습니다.

현재 사용하는 외부 엔드포인트:

```text
GET https://api.odcloud.kr/api/gov24/v3/serviceList
GET https://api.odcloud.kr/api/gov24/v3/serviceDetail
```

## 환경변수

| 이름 | 필수 | 기본값 | 설명 |
| --- | --- | --- | --- |
| `DATA_GO_KR_SERVICE_KEY` | 운영 권장 | 빈 값 | 공공서비스 목록·상세 조회 인증키 |
| `SPRING_DATASOURCE_URL` | 아니요 | H2 메모리 URL | JDBC 데이터베이스 URL |
| `SPRING_DATASOURCE_USERNAME` | 아니요 | `sa` | 데이터베이스 사용자 |
| `SPRING_DATASOURCE_PASSWORD` | 아니요 | 빈 값 | 데이터베이스 비밀번호 |
| `SPRING_JPA_HIBERNATE_DDL_AUTO` | 아니요 | `create-drop` | 로컬 스키마 정책. 운영은 `update` 사용 중 |
| `SPRING_JPA_DATABASE_PLATFORM` | 아니요 | H2 Dialect | 운영은 PostgreSQL Dialect |
| `SESSION_COOKIE_SECURE` | 아니요 | `false` | HTTPS 운영 환경에서는 `true` |

## 데이터 동기화

`DATA_GO_KR_SERVICE_KEY`가 있으면 애플리케이션 시작 직후 전체 목록 동기화를 백그라운드에서 시작하고 매일 오전 4시 20분에 다시 실행합니다.

동기화 설계:

- 공공 API를 페이지 단위로 조회
- `externalId`를 기준으로 기존 데이터 갱신
- JPA 배치 저장
- 동기화 상태를 `READY`, `SYNCING`, `PARTIAL`, `WAITING`, `DISABLED`, `ERROR`로 공개
- 외부 API 장애 시 마지막 저장 데이터 유지
- 상세정보는 서비스 ID 단건 조회 후 6시간 캐시

## REST API

### 상태 확인

```http
GET /api/health
```

### 혜택 검색

```http
GET /api/programs?region=서울&category=주거·자립&keyword=월세&age=청년&household=1인%20가구&page=0&size=24
```

`age`와 `household`은 맞춤진단에서 사용합니다. 선택 연령과 충돌하는 전용 혜택과 선택 가구 형태에 명백히 맞지 않는 전용 혜택은 서버에서 제외하며, 연령·가구 제한이 없거나 선택 조건을 포함하는 공통 혜택은 유지합니다.

`audienceStatus`와 `audienceReason`은 자격 확정 결과가 아니라 검색 결과를 설명하기 위한 보조 판정입니다. `MATCHED`는 확인 우선순위를 높이고, `GENERAL`은 공식 기준 추가 확인이 필요하다는 뜻입니다.

응답 예시:

```json
{
  "items": [
    {
      "id": 1,
      "externalId": "SERVICE_ID",
      "title": "청년 주거 지원",
      "region": "서울",
      "category": "주거·자립",
      "target": "지원 대상 요약",
      "summary": "사업 설명",
      "benefit": "지원 내용",
      "deadline": "상시 신청",
      "audienceStatus": "MATCHED",
      "audienceReason": "선택한 청년 조건과 지원대상 문구가 일치합니다.",
      "application": {
        "mode": "OFFICIAL_SITE",
        "label": "공식 접수처 확인 필요",
        "description": "신청서는 여기서 준비하고 공식 화면에서 제출합니다.",
        "directAvailable": false,
        "officialUrl": "https://..."
      }
    }
  ],
  "page": 0,
  "size": 24,
  "total": 100,
  "hasMore": true
}
```

### 혜택 메타데이터

```http
GET /api/programs/meta
```

저장 건수, 원본 전체 건수, 동기화 상태, 마지막 동기화 시각, 분야별 건수를 반환합니다.

### 혜택 단건·상세

```http
GET /api/programs/{id}
GET /api/programs/{id}/detail
```

상세 API는 서비스 ID로 공식 목록·상세 API를 조회하고 저장 데이터와 병합합니다.

### 계정

```http
GET  /api/auth/me
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
```

회원가입 요청:

```json
{
  "email": "user@example.com",
  "password": "at-least-8-characters",
  "displayName": "안심이"
}
```

로그인 요청:

```json
{
  "email": "user@example.com",
  "password": "password"
}
```

### 맞춤 조건 프로필

```http
GET    /api/profile
PUT    /api/profile
DELETE /api/profile
```

`PUT /api/profile` 요청 예시:

```json
{
  "region": "서울",
  "ageGroup": "청년",
  "household": "1인 가구",
  "need": "주거·자립",
  "incomeRange": "기준중위소득 50~100%"
}
```

이 API는 로그인 세션이 필요하며, 허용된 지역·연령대·가구 상황·분야 값만 저장합니다. `incomeRange`는 정확한 금액이 아닌 선택형 참고 구간이고, 최종 자격판정이나 소득 조회에 사용하지 않습니다. 비로그인 상태에서는 조건을 현재 브라우저에서만 사용합니다.

### 혜택 준비상태

```http
GET    /api/applications/drafts
POST   /api/applications/drafts
DELETE /api/applications/drafts/{id}
```

저장 요청:

```json
{
  "programId": 1,
  "eligibilityConfirmed": true,
  "documentsReady": true
}
```

이 API에는 신청자의 이름, 연락처, 주소, 소득정보나 증빙파일을 보내지 않습니다. 서버는 혜택 ID와 두 개의 준비상태만 저장합니다.

### 사용자 진행상태

```http
POST /api/applications/drafts/{id}/journey
```

요청 예시:

```json
{
  "status": "RESULT_WAITING",
  "receiptMemo": "정부24 접수번호 2026-1234",
  "nextActionDate": "2026-09-15"
}
```

서버는 허용된 상태값만 받고, 다른 사용자의 혜택 준비상태에는 접근할 수 없습니다. `USER_REPORTED_SUBMITTED`를 포함한 모든 진행상태는 사용자가 남긴 기록이며 기관 접수 증명이 아닙니다.

### 실제 신청 제출 API는 제공하지 않음

현재 버전에는 안심생활에서 정부 혜택을 직접 제출하는 API나 버튼이 없습니다. 공공데이터포털 API는 혜택 조회·상세정보 제공 목적으로만 사용하고, 신청용 개인정보는 공식 기관에만 입력하게 합니다.

직접 제출 기능이 필요해진다면 단순 API 키가 아니라 기관별 서면 승인, 본인인증·전자서명 정책, 개인정보 처리 근거, 신청 명세와 운영 자격증명을 먼저 확보해야 합니다. 이 조건을 갖추기 전에는 UI만 만들어 접수된 것처럼 표시해서는 안 됩니다.

## 신청 채널 모델

혜택 응답의 `application.mode`는 다음 중 하나입니다.

| 모드 | 의미 | 화면 동작 |
| --- | --- | --- |
| `OFFICIAL_SITE` | 공식 온라인 신청 URL 존재 | 준비 후 공식 접수처로 이동 |
| `PREPARATION_ONLY` | 온라인 URL이 확인되지 않음 | 전화·방문 접수 방법 안내 |
| `NO_APPLICATION` | 별도 신청 절차가 없는 혜택 | 제공 조건과 이용방법 확인 |

## 향후 기관 연동에 필요한 조건

기관과 정식 협의를 거쳐 실제 신청 기능을 추가하려면 최소한 다음이 필요합니다.

- 기관의 서면 연동 승인
- 개발·운영 API 명세
- 샌드박스와 운영 자격증명
- 전자서명 또는 인증서 정책
- 개인정보 처리위탁·제3자 제공 검토
- 실패 재시도와 중복접수 방지 체계
- 접수상태 콜백 또는 조회 API
- 장애·철회·정정·삭제 대응 절차

위 조건이 충족된 혜택만 별도의 검증된 연동 서비스로 분리하는 것을 권장합니다. 현재 공개 버전은 이 기능을 활성화하지 않습니다.

## 데이터 모델 핵심

### `SupportProgram`

검색에 필요한 공공혜택 요약을 저장합니다. 공공데이터의 서비스 ID는 `externalId`로 유일하게 관리합니다.

### `UserAccount`

이메일, BCrypt 비밀번호 해시, 표시 이름을 저장합니다. 평문 비밀번호는 저장하지 않습니다.

### `UserProfile`

로그인 사용자 한 명당 하나의 맞춤 조건을 저장합니다. 지역, 연령대, 가구 상황, 관심 분야와 선택형 소득 구간 및 마지막 수정시각을 보관하며, 정확한 소득·재산정보나 증빙파일은 보관하지 않습니다.

### `ApplicationDraft`

사용자가 확인한 조건·서류 체크, 준비도와 사용자 진행상태를 저장합니다. 신청서 작성에 필요한 개인정보는 저장하지 않습니다.

중요 필드:

- `status`: `DRAFT`, `READY_TO_SUBMIT` (`SUBMITTED`는 이전 스키마 호환용)
- `completionPercent`: 필수 준비항목 완료율
- `journeyStatus`: 사용자가 관리하는 신청 여정 상태
- `userReceiptMemo`: 사용자가 입력한 접수번호 또는 메모
- `nextActionDate`: 다음 확인 예정일
- `eligibilityConfirmed`: 사용자가 공식 지원대상을 확인했는지 여부
- `documentsReady`: 사용자가 준비서류 체크를 마쳤는지 여부

`userReceiptMemo`는 사용자가 직접 적는 선택 메모이며 기관이 검증한 접수번호가 아닙니다.

## 보안과 개인정보

현재 구현된 보호 조치:

- BCrypt 비밀번호 해시
- HttpOnly 세션 쿠키
- 운영 환경 Secure 쿠키
- SameSite=Lax
- 사용자별 신청 데이터 소유권 검사
- 입력 문자열 길이 제한
- 허용된 진행상태만 저장
- 브라우저 출력 시 HTML 이스케이프
- 외부 링크에 `noopener noreferrer`
- 신청자 이름·전화번호·주소·정확한 소득·재산정보 입력 UI 미제공
- 맞춤진단의 소득 구간은 선택형·비정밀 참고값으로만 저장
- 주민등록번호·계좌·증빙 원본 업로드 UI 미제공
- 혜택 준비 API가 개인정보 필드를 받거나 반환하지 않음

운영 서비스로 확장하기 전에 추가로 필요한 작업:

- 이메일 인증과 비밀번호 재설정
- CSRF 보호 전략
- 로그인·회원가입 rate limit
- 개인정보 처리방침과 이용약관
- 회원탈퇴 및 개인정보 삭제
- 관리자 접근통제와 감사 로그
- 애플리케이션 암호화 키 관리
- Flyway 또는 Liquibase 스키마 마이그레이션
- 데이터 보존기간과 자동 파기
- 보안 헤더(CSP, HSTS 등)
- 의존성·컨테이너 취약점 검사

이 저장소는 학습·개인 프로젝트 단계이며, 민감한 실제 신청 데이터를 다루기 전 법률·보안 검토가 필요합니다.

## 테스트

```bash
mvn test
```

현재 단위 테스트는 다음 불변조건을 확인합니다.

- 필수 준비항목 완료 시 `READY_TO_SUBMIT`
- 사용자의 신청완료 기록이 기관 접수로 바뀌지 않음
- 허용되지 않은 진행상태 거부
- 연령대·가구 조건과 전용 혜택의 일치/제외 판정
- 로그인 사용자의 맞춤 조건 저장·조회와 허용값 검증

운영 전 권장 테스트:

- 컨트롤러 인증·소유권 통합 테스트
- 공공데이터 API 실패·지연·필드 변경 테스트
- 혜택 준비 API에 개인정보 필드가 노출되지 않는지 확인
- 모바일 360px, 390px, 768px와 데스크톱 1440px 시각 회귀 테스트
- 키보드 탐색과 스크린리더 접근성 테스트

## Docker 빌드

```bash
docker build -t ansimlife .
docker run --rm -p 8080:8080 \
  -e DATA_GO_KR_SERVICE_KEY="your-service-key" \
  ansimlife
```

`Dockerfile`은 Maven 빌드 단계와 JRE 실행 단계를 분리한 멀티스테이지 빌드를 사용합니다.

## Coders 배포

`coders.yaml`에는 웹 서비스와 PostgreSQL 컴포넌트가 정의되어 있습니다.

배포 기준 저장소는 `boclair98/ansimlife`입니다. `coders-kr/ansimlife`는 원본의 실제 GitHub Fork이며, 두 저장소의 기본 브랜치는 같은 커밋이어야 합니다.

업데이트 순서:

1. 로컬에서 빌드·테스트·반응형 화면을 확인합니다.
2. 원본 `boclair98/ansimlife`의 `main`에 먼저 커밋하고 push합니다.
3. Fork를 원본 기준으로 동기화합니다.

   ```bash
   gh repo sync coders-kr/ansimlife -b main
   ```

4. 두 저장소의 `main` 전체 커밋 SHA가 같은지 확인합니다.
5. coders.kr 배포 설정에서 원본 저장소 URL `https://github.com/boclair98/ansimlife`를 배포 소스로 사용합니다.
6. 배포가 `ready`가 된 뒤 운영 URL에서 검색, 맞춤진단, 상세, 신청 준비 화면을 확인합니다.

```yaml
services:
  web:
    dockerfile: Dockerfile
    context: .
    port: 8080
    expose: public
  db:
    type: postgres
    size: 1Gi
```

배포 환경에는 최소한 다음 비밀값을 설정해야 합니다.

```text
DATA_GO_KR_SERVICE_KEY
```

PostgreSQL 연결정보는 `coders.yaml`의 컴포넌트 참조를 통해 웹 서비스에 전달됩니다. `.coders/` 디렉터리와 로컬 토큰은 `.gitignore`로 제외되어 있습니다.


## 운영·자동 배포

- 배포 원본은 [boclair98/ansimlife](https://github.com/boclair98/ansimlife)의 기본 브랜치입니다.
- 조직 저장소 [coders-kr/ansimlife](https://github.com/coders-kr/ansimlife)는 원본의 실제 Fork로 유지하고, 원본 변경 후 동기화합니다.
- Coders.kr 프로젝트는 [ansimlife.coders.kr](https://ansimlife.coders.kr)이며, 원본 저장소의 변경을 기준으로 빌드·릴리스합니다.
- Coders.kr push-to-deploy는 원본 `main`에 연결되어 있어, 검증된 push가 새 배포를 자동으로 시작합니다.
- 변경은 CI 검증을 통과한 뒤 원본 `main`에 반영하고, 배포 상태와 운영 URL을 확인합니다.

## 문제 해결

### 전체 혜택이 보이지 않을 때

1. `DATA_GO_KR_SERVICE_KEY`가 설정됐는지 확인합니다.
2. `/api/programs/meta`의 `syncStatus`를 확인합니다.
3. 공공데이터포털 활용신청 상태와 일일 호출량을 확인합니다.
4. 인코딩 키를 다시 인코딩하지 않았는지 확인합니다.

### 상세정보가 저장 데이터로 표시될 때

상세 API 호출이 실패하거나 제한시간을 넘기면 마지막 저장정보를 보여줍니다. 잠시 뒤 다시 열고 서버 로그에서 외부 API 응답 상태를 확인합니다.

### 로그인은 되지만 혜택 준비상태가 사라질 때

- 운영 DB가 H2가 아니라 PostgreSQL인지 확인합니다.
- Spring Session 테이블 초기화 권한을 확인합니다.
- HTTPS 환경에서 `SESSION_COOKIE_SECURE=true`인지 확인합니다.
- 여러 도메인을 사용할 경우 쿠키 도메인과 SameSite 정책을 확인합니다.

### 왜 개인정보 입력이나 `기관에 신청하기` 버튼이 없나요?

의도된 동작입니다. 현재 버전은 신청 대행 서비스가 아니라 혜택 내비게이터입니다. 조건·서류 체크를 끝내면 `공식 신청처 열기`를 제공하며, 개인정보와 증빙은 해당 기관에 직접 제출합니다.

## 현실적인 확장 순서

1. 맞춤진단과 검색 정확도 개선
2. 공식 정보 변경 알림
3. 이메일 인증, 탈퇴, 데이터 삭제
4. 마감·다음 확인일 알림
5. 지역·대상별 신청 가이드 품질 개선
6. 공식 접수처 링크 품질 자동 점검
7. 기관과 정식 협의가 완료된 별도 파일럿 검토

카카오 알림톡, 문자, OCR, 지도 API는 핵심 탐색·준비 기능에 필수는 아닙니다. 개인정보와 운영비용을 고려해 실제 필요가 생긴 뒤 추가하는 편이 안전합니다.

## 기여 방법

1. 이슈에서 개선 내용과 재현 방법을 설명합니다.
2. 별도 브랜치에서 수정합니다.
3. `mvn test`를 실행합니다.
4. 모바일과 데스크톱 화면을 확인합니다.
5. 기관 접수 여부를 과장하는 문구가 없는지 점검합니다.
6. Pull Request에 변경 내용과 테스트 결과를 작성합니다.

공공데이터 필드 매핑, 접근성, 지역별 신청 가이드와 테스트 추가를 환영합니다. 신청용 개인정보를 수집하거나 실제 접수를 흉내 내는 변경은 받지 않습니다.

## 고지

안심생활이 제공하는 정보는 공공기관의 원본 안내를 이해하기 쉽게 정리한 참고자료입니다. 정보 갱신 시차가 있을 수 있으며, 실제 신청 가능 여부, 제출서류, 접수 완료와 선정 결과는 해당 기관의 공식 안내와 판단을 따릅니다.
