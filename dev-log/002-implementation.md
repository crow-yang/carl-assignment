# 002. 구현 과정 기록

> 작성일: 2026-02-28

## Phase 0: 프로젝트 초기화

### 0-1. 스캐폴딩 (Vite + React 19 + TS + Tailwind + ESLint)
- `npm create vite@latest` → React + TypeScript (SWC) 템플릿
- Tailwind CSS v4 설치 (`@tailwindcss/vite` 플러그인 방식)
- ESLint React 19 설정 (react-hooks, react-refresh 플러그인)

### 0-2. 테스트 환경
- Vitest + RTL + Playwright 설치
- **트러블슈팅: jsdom 28 + Node.js 20.15.1 비호환**
  - 증상: `require() of ES Module html-encoding-sniffer` 에러
  - 원인: jsdom 28의 ESM 전환과 Node 20.15.1의 require 호환성 충돌
  - 해결: `happy-dom`으로 대체. 동일 API, Node 호환성 우수

---

## Phase 1: 순수 함수 게임 로직 (97 테스트)

### 1-1. 타입 정의 (types/index.ts, 145줄)
- GamePhase, Difficulty, Stats, Skill (discriminated union), Character, BattleState 등
- StatusEffectSkill: buff/debuff 통합 (리뷰 결정)

### 1-2. 상수 (constants/index.ts, 115줄)
- TOTAL_STAT_POINTS, STAT_RANGES, DEFAULT_SKILLS, ENEMY_STATS/SKILLS/NAMES

### 1-3. 검증 로직 + Zod 스키마 (22 테스트)
- **트러블슈팅: Zod v4 `.check()` 미동작**
  - 증상: `statsSchema.check(z.check(...))` 가 총합 200 검증을 통과시킴
  - 원인: Zod v4의 `.check()` API가 object 레벨 refinement와 다르게 동작
  - 해결: `z.pipe(baseStatsSchema, z.custom(...))` 패턴 사용

### 1-4. 데미지 + 효과 (23 테스트)
- calculateDamage: ATK×배율 - DEF×0.5, 방어 시 ×0.5, 최소 1
- getEffectiveStat: base + buffs - debuffs (최소 0)
- tickEffects: 턴 감소 + 만료 제거
- addEffect: 불변 추가

### 1-5. 턴 + 스킬 실행 (18 테스트)
- **트러블슈팅: -0 vs 0**
  - 증상: `toBe(0)` 테스트가 -0에서 실패
  - 원인: `-skill.mpCost` (mpCost=0일때) → -0
  - 해결: `mpChange()` 헬퍼 — `cost === 0 ? 0 : -cost`

### 1-6. 상태 머신 (13 테스트)
- nextPhase() 순수 함수: 모든 전이 경로를 명시적으로 정의
- 풀 플로우 시뮬레이션 테스트 2개 포함

### 1-7. 액션 큐 (9 테스트)
- createQueue, enqueue, enqueueAll, dequeue — 모두 불변 함수
- FIFO 순서 보장, 빈 큐 안전 처리

### 1-8. 적 AI (12 테스트)
- 3단계 난이도별 전략, rng 주입으로 결정적 테스트
- MP 부족 시 기본공격 fallback

---

## Phase 2: 상태 관리 (36 테스트)

### Zustand 스토어 3개
- **game-store**: 단순 phase 관리 (setup → battle → result)
- **setup-store**: 3스텝 네비게이션, 스탯 클램핑, 커스텀 스킬 CRUD, 잔여 포인트 계산
- **battle-store**: 전투 오케스트레이션 (initBattle, executePlayerAction, processQueue)

### 헬퍼 함수 타입 수정
- 자동 생성된 `import('./battle-store').never extends never ? ...` 패턴 → `SkillExecutionResult` 직접 import

### 린트 수정
- `useSkill` 함수명 → `skillAction`으로 변경 (React hooks 규칙 오탐)
- `MAX_ROUNDS` 미사용 import 제거

---

## Phase 3-5: UI 구현

### 세팅 UI (6개 컴포넌트)
- SetupPage, StepIndicator, Step1NameAndStats, Step2Skills, SkillForm, Step3Difficulty
- data-testid 명세 완전 준수
- 잔여 포인트 실시간 표시, 범위 클램핑, 스킬 타입별 동적 폼

### 전투 UI (4개 컴포넌트)
- BattlePage, CharacterPanel, ActionPanel, BattleLog
- **액션 큐 소비 패턴**: 이벤트 핸들러에서 직접 시작 (Effect 내 setState 금지 린트 준수)
- HP/MP 바 + 버프/디버프 뱃지 표시
- 전투 로그 자동 스크롤

### 결과 UI
- **트러블슈팅: Zustand 셀렉터 무한 리렌더**
  - 증상: E2E 테스트에서 결과 화면이 빈 페이지 (React 크래시)
  - 원인: `useBattleStore((s) => s.getResult())` → 매 렌더마다 새 객체 반환 → Object.is 비교 실패 → 무한 리렌더
  - 해결: 프리미티브 셀렉터 사용 — `(s) => s.battleState?.result`, `(s) => s.battleState?.round`
  - **교훈: Zustand 셀렉터에서 새 객체/배열을 반환하면 안 됨. 항상 프리미티브 또는 useShallow 사용**

---

## Phase 6: E2E 테스트 (10개)

### setup-flow.spec.ts (5개)
- 이름/스탯 입력 → 다음, 잔여 포인트 검증, 스킬 추가/삭제, 난이도 선택, 값 보존

### battle-flow.spec.ts (4개)
- 캐릭터 정보 표시, 공격/방어 로그, 라운드 진행

### full-game.spec.ts (1개)
- 세팅 → 전투 → 결과 → 다시 시작 전체 플로우

---

## 테스트 요약

| 카테고리 | 테스트 파일 | 테스트 수 |
|----------|-----------|----------|
| 데미지 | damage.test.ts | 8 |
| 효과 | effects.test.ts | 15 |
| 스킬 실행 | skill-executor.test.ts | 9 |
| 턴 진행 | turn.test.ts | 9 |
| 상태 머신 | battle-state-machine.test.ts | 13 |
| 액션 큐 | action-queue.test.ts | 9 |
| 적 AI | enemy-ai.test.ts | 12 |
| 검증 | validation.test.ts | 22 |
| game-store | game-store.test.ts | 3 |
| setup-store | setup-store.test.ts | 18 |
| battle-store | battle-store.test.ts | 15 |
| **유닛 합계** | | **133** |
| E2E | 3 파일 | **10** |
| **전체 합계** | | **143** |

---

## Review Cycle #1: 코드 리뷰 + 리팩토링

> 전체 코드베이스를 대상으로 1차 리뷰 수행. 11개 이슈 발견, 우선순위별 수정.

### 발견된 이슈와 수정 내역

| # | 우선순위 | 이슈 | 수정 내용 |
|---|---------|------|----------|
| 1 | HIGH | SPD 선공 판정에 DEF 버프/디버프 반영 | `getEffectiveStat(spd, 'def', [])` → `baseStats.spd` 직접 사용 |
| 2 | HIGH | HP 바가 즉시 최종값으로 점프 | ActionQueueItem에 playerSnapshot/enemySnapshot 추가, UI가 큐 소비 시 스냅샷 기반 렌더링 |
| 3 | MEDIUM | heal이 logEntry.heal 간접 참조 | SkillExecutionResult에 actorHpChange 필드 추가, applyActorResult에서 직접 사용 |
| 4 | MEDIUM | setStat 총 포인트 초과 허용 | 다른 스탯 합산 계산 → maxAllowed 제한 추가 |
| 5 | MEDIUM | toQueueItem buff/debuff → defend 분류 | logEntry.effect 필드로 buff(+)/debuff(-) 구분하는 determineQueueItemType 함수 추가 |
| 6 | LOW | BattleAction optional skillId | 판별 유니온으로 변경 (skill 타입만 skillId 필수) |
| 7 | LOW | effectIdCounter 게임 간 미리셋 | battle-store reset()에서 resetEffectIdCounter() 호출 |
| 8 | LOW | inline import() 타입 | 정규 import로 교체 |
| 9 | LOW | StepIndicator 접근성 부재 | nav/ol/aria-current 마크업 추가 |

### 트러블슈팅

#### SPD 선공 판정 버그
- **증상**: DEF 버프가 있는 캐릭터의 선공 순서가 비정상적으로 변경됨
- **원인**: `getEffectiveStat(playerStats.spd, 'def', effects)` — SPD를 DEF stat type으로 전달하여 DEF 관련 효과가 SPD에 반영됨
- **근본 원인**: SPD는 버프/디버프 대상이 아닌데 `getEffectiveStat`을 불필요하게 경유
- **해결**: raw `baseStats.spd`를 직접 사용하고, 미사용된 `getEffectiveStat` import 제거

#### 스냅샷 기반 큐 애니메이션 설계
- **문제**: executePlayerAction이 라운드 전체를 동기 처리하고 최종 상태로 store 업데이트 → 큐 소비 시 HP 바가 이미 최종값
- **설계**: ActionQueueItem에 그 시점의 Character 스냅샷(playerSnapshot, enemySnapshot) 저장
- **UI 흐름**: `displayPlayer/displayEnemy` state로 스냅샷 표시 → 큐 비면 null로 리셋 → battleState 최종값 복귀
- **trade-off**: 스냅샷 데이터 중복이 있지만, 로직/UI 분리 원칙 유지와 올바른 연출이 더 중요

### 검증 결과
- ESLint: 0 에러
- TypeScript: 0 에러
- 유닛 테스트: 133개 통과
- E2E 테스트: 10개 통과 (16.5s)

---

## Review Cycle #2: 기술 스택 베스트 프랙티스 기반 심층 리뷰

> React 19, TypeScript strict, Zustand, Tailwind, Playwright 공식 가이드라인 기반 리뷰.
> 24개 실질 이슈 발견 (HIGH 1, MEDIUM 8, LOW 15), 주요 이슈 수정.

### 발견된 이슈와 수정 내역

| # | 우선순위 | 이슈 | 수정 |
|---|---------|------|------|
| 6 | HIGH | 적 resolveSkill 실패 시 플레이어 액션까지 유실 | 기본공격 fallback 추가 |
| 5 | MEDIUM | `difficulty!` 비null 단언 | 명시적 null 가드로 교체 |
| 12 | MEDIUM | `lang="en"` + placeholder title | `lang="ko"` + "턴제 배틀 게임" |
| 21 | MEDIUM | effect 문자열(+/-) 파싱으로 buff/debuff 분류 | TurnLogEntry에 skillType 필드 추가, exhaustive switch |
| 23 | MEDIUM | ErrorBoundary 없음 | App에 ErrorBoundary 래핑 |
| 24 | MEDIUM | E2E waitForTimeout 플레이키 | 조건 기반 대기(버튼 활성화) — 14s로 단축 |
| 25 | LOW→MEDIUM | "라운드 증가" assertion 약함 | roundNum >= 2 명시적 비교 |
| 16 | MEDIUM | HP/MP 바 접근성 없음 | progressbar ARIA 속성 추가 |
| 32 | LOW | isProcessingQueue dead state | 제거 |
| 33 | LOW | SkillForm 타입 버튼 접근성 | aria-pressed 추가 |
| 15 | LOW | TYPE_LABELS Record<string> | Record<SkillType>으로 강화 |
| 26 | LOW | enemy-ai 중복 hpRatio 조건 | 제거 |

### 미수정 이슈 (의도적 보류)

| # | 이슈 | 보류 이유 |
|---|------|----------|
| 2 | getAllSkills/getRemainingPoints 파생 상태 | 현재 co-subscription으로 정상 동작, 과도한 리팩토링 |
| 9 | SkillForm에 RHF+Zod 적용 | 번들 사이즈 감소보다 기존 패턴 일관성 유지 |
| 14 | number input 중간값 문제 | UX 영향 미미, 과도한 복잡도 추가 |

### 검증 결과
- ESLint: 0 에러
- TypeScript: 0 에러
- 유닛 테스트: 133개 통과
- E2E 테스트: 10개 통과 (14.0s, 이전 대비 2.5s 단축)

---

## 리뷰 사이클 #3: 전투 메커니즘 심화

### 발견 이슈 (3 MEDIUM + 1 LOW)

| # | 우선순위 | 이슈 | 수정 |
|---|---------|------|------|
| 1 | MEDIUM | 후공의 방어 플래그가 라운드 종료 시 초기화 → 방어 스킬 낭비 | 후공이 방어 시 해당 플래그를 다음 라운드로 유지 |
| 2 | MEDIUM | 전투 로그가 큐 소비 전에 전체 공개 → 선공 결과 스포일러 | prevLogLength + revealedCount로 큐 소비 속도에 맞춰 점진적 공개 |
| 3 | MEDIUM | 적 AI가 선공 결과 전에 행동 결정 | 의도적 설계 (동시 결정 모델) — 보류 |
| 4 | LOW | MP 부족 시 스킬 사용 불가 테스트 누락 | battle-store.test.ts에 테스트 추가 |

### 기술 상세

**후공 방어 플래그 (battle-store.ts)**
- 기존: 라운드 종료 시 `playerDefending: false, enemyDefending: false`로 리셋
- 수정: 후공이 방어한 경우 해당 side의 플래그만 유지, 나머지는 false
- 효과: 후공 방어 → 다음 라운드 선공 공격에 대해 방어 적용 (1라운드 지속)

**로그 점진적 공개 (BattlePage.tsx)**
- `prevLogLength`: 액션 실행 전 로그 길이 저장 (state)
- `revealedCount`: 큐 소비 시 1씩 증가
- 렌더: `isAnimating ? log.slice(0, prevLogLength + revealedCount) : log`
- React 19 lint: `useRef` → `useState` 변경 (렌더 중 ref 접근 금지 규칙 준수)

### 검증 결과
- ESLint: 0 에러
- TypeScript: 0 에러
- 유닛 테스트: 134개 통과 (+1 MP 부족 테스트)
- E2E 테스트: 10개 통과 (13.5s)

---

## 리뷰 사이클 #4: 최종 심층 리뷰

### 발견 이슈 (4 HIGH + 6 MEDIUM + 8 LOW)

| # | 우선순위 | 이슈 | 수정 |
|---|---------|------|------|
| 1 | HIGH | 버프/디버프 무한 중첩 → 스탯 무한 증가 | addEffect에서 같은 type+targetStat 교체 |
| 8 | MEDIUM | react-hook-form/resolvers 미사용 | 의존성 제거 |
| 6 | MEDIUM | SkillForm Enter 키 제출 불가 | `<form>` 래핑 |
| 7 | MEDIUM | 스탯 입력 aria-label 없음 | aria-label 추가 |
| 9 | MEDIUM | BattleLog aria-live 없음 | role="log" + aria-live="polite" |

### 기술 상세

**효과 중첩 방지 (effects.ts)**
- 기존: `addEffect`가 무조건 배열에 추가 → 같은 ATK 버프 무한 중첩 가능
- 수정: 같은 `type`+`targetStat` 조합의 기존 효과를 필터링 후 새 효과 추가 (교체)
- 다른 type 간 (buff+debuff) 또는 다른 stat 간은 중첩 허용
- 테스트 3개 추가로 교체/허용 동작 검증

### 보류 이슈

| # | 이슈 | 보류 이유 |
|---|------|----------|
| 2 | effectIdCounter 모듈 수준 | Vitest 단일 스레드, 실용적 문제 없음 |
| 3 | 타이머 race condition | isAnimating 가드가 이중 실행 차단 |
| 4 | 적 AI 동시 결정 | 의도적 설계 (사이클 #3에서 결정) |

### 검증 결과
- ESLint: 0 에러
- TypeScript: 0 에러
- 유닛 테스트: 137개 통과 (+3 효과 중첩 테스트)
- E2E 테스트: 10개 통과 (15.3s)

---

## 리뷰 사이클 #5: 최최종 확인

### 발견 이슈 (2개)

| # | 이슈 | 수정 |
|---|------|------|
| 1 | `enemy-ai.test.ts`에서 BattleAction 유니온 타입 미좁힘 → `tsc -b` 빌드 실패 (7개 에러) | `expectSkillId` 헬퍼로 타입 좁힘 |
| 2 | SkillForm `<form>` 내부 버튼에 `type="button"` 누락 → 타입/스탯 선택 시 의도치 않은 제출 | `type="button"` 추가 |

### 검증 결과
- ESLint: 0 에러
- TypeScript: 0 에러
- **빌드 성공** (`tsc -b && vite build` — 290KB gzip 87KB)
- 유닛 테스트: 137개 통과
- E2E 테스트: 10개 통과 (14.0s)

---

## 커버리지 100% 달성

> 137 → 153 유닛 테스트로 확장하여 라인/함수 커버리지 100% 달성.

### 커버리지 개선 내역

| 파일 | 이전 | 이후 | 추가 테스트 |
|------|------|------|-----------|
| enemy-ai.ts | 80% | 100% | +7 (normal/hard 미커버 분기) |
| battle-store.ts | 87% | 100% | +7 (적 선공, 후공 사망, 무승부, 힐/버프/디버프 큐, 패배) |
| setup-store.ts | 69% branches | 100% | +2 (디버프 스킬, 옵셔널 기본값) |

### 최종 커버리지
- Statements: 99.68%
- Lines: **100%**
- Functions: **100%**
- Branches: 97% (나머지 3%는 방어적 가드 — 적이 항상 기본공격 보유)

---

## 리뷰 사이클 #6: DRY 리팩토링

> 커버리지 100% 달성 후 코드 품질 리팩토링. 9개 이슈 발견, 5개 수정.

### 수정 이슈

| # | 우선순위 | 이슈 | 수정 |
|---|---------|------|------|
| 1 | HIGH | `executePlayerAction` ~147행, 선공/후공 중복 | `executeMoverTurn` + `makeBattleEndState` 헬퍼 추출 |
| 2 | MEDIUM | `getRemainingPoints` 합산 중복 | `sumStats()` → constants에 추가, setup-store + schema에서 재사용 |
| 8 | LOW | `STAT_KEYS` 로컬 중복 선언 | constants로 이동 |
| 9 | LOW | `SKILL_TYPE_LABELS` 2곳 중복 | constants에 통합, SkillForm + Step2Skills에서 공유 |
| 3 | LOW | `action-queue.ts` 미사용 dead code | 파일 + 테스트 삭제 (프로덕션 미사용) |

### 기술 상세

**executeMoverTurn 추출 (battle-store.ts)**
- 기존: 선공/후공 각각 ~35행의 동일 패턴 (executeSkill → if/else actor/target → applyResult → push)
- 수정: `executeMoverTurn(player, enemy, skill, side, round, opponentDefending)` 헬퍼가 스킬 실행 + 결과 반영 + 큐 아이템 생성을 일괄 처리
- 내부에서 side 기반으로 actor/target을 매핑하여 if/else 제거
- `makeBattleEndState` 추가로 전투 종료 set() 중복도 제거

**상수 통합 (constants/index.ts)**
- `STAT_KEYS`: Step1NameAndStats 로컬 → constants로 이동
- `SKILL_TYPE_LABELS`: SkillForm + Step2Skills 각각 선언 → constants 단일 소스
- `sumStats()`: setup-store `getRemainingPoints` + schema `statsSchema` 합산 로직 통합

### 보류 이슈 (과잉 리팩토링 판단)

| # | 이슈 | 보류 이유 |
|---|------|----------|
| 4 | SkillForm 검증 매직넘버 | 스키마(서버)와 UI 검증은 역할이 다르고 라벨 텍스트 포함 |
| 5 | HP/MP 바 컴포넌트 추출 | 2곳, 색상 다름, 추상화 이득 없음 |
| 6 | toQueueItem targetStat 미설정 | optional 필드, 기능 무해 |
| 7 | 모듈 ID 카운터 | 테스트 전용 reset, 프로덕션 무해 |

### 검증 결과
- ESLint: 0 에러
- TypeScript: 0 에러
- 빌드 성공
- 유닛 테스트: 144개 통과 (action-queue 9개 테스트 제거)
- E2E 테스트: 10개 통과 (14.0s)

---

## 리뷰 사이클 #7: 채점 기반 전면 보완

> 채점 시뮬레이션에서 92~95점 평가. 아키텍처(-2), 코드 품질(-2), UI/UX(-3) 감점 요인 7개를 전부 보완.
> 8개 원자적 커밋으로 분리 구현. 신규 npm 의존성 없이 CSS 키프레임 + Tailwind만 사용.

### 감점 요인과 대응

| 영역 | 감점 | 원인 | 대응 커밋 |
|------|------|------|----------|
| 아키텍처 | -1 | battle-store.ts ~310줄, 순수 로직과 상태 관리 혼재 | #1: executeRound 순수 함수를 lib/round-executor.ts로 추출 (~95줄로 축소) |
| 아키텍처 | -1 | getRemainingPoints 함수 구독 → 불필요한 리렌더 | #2: selectRemainingPoints 외부 셀렉터 패턴으로 변경 |
| 코드 품질 | -1 | BattlePage ~60줄 큐 애니메이션 로직 혼재 | #3: useQueueAnimation 커스텀 훅 추출 + renderHook 테스트 6개 |
| 코드 품질 | -1 | toQueueItem value 매핑 `?? logEntry.heal` 암시적 | #4: resolveQueueValue exhaustive switch |
| UI/UX | -1 | 모바일 레이아웃 미대응 | #5: sm: 반응형 브레이크포인트 |
| UI/UX | -1 | 페이즈 전환 하드 컷 | #6: @theme 커스텀 애니메이션 6종 + key prop fade-in |
| UI/UX | -1 | 전투 비주얼 없음 (데미지 팝업, 피격 이펙트) | #7: DamagePopup + shouldShowPopup/getActiveEffect + 22개 테스트 |

### 커밋 상세

**커밋 1: executeRound 순수 함수 추출**
- `src/lib/round-executor.ts` 생성 (258줄, ASCII 실행 플로우 다이어그램 포함)
- `src/stores/battle-store.ts` 310→95줄 (5줄 위임)
- 기존 23개 battle-store 테스트가 통합 테스트로 계속 검증

**커밋 2: selectRemainingPoints 셀렉터**
- 스토어 내부 함수 → 외부 파생 셀렉터 (프리미티브 반환으로 리렌더 최적화)
- Step1NameAndStats에서 `useSetupStore(selectRemainingPoints)` 사용

**커밋 3: useQueueAnimation 훅**
- isAnimating, displayPlayer/Enemy, currentItem, startConsuming, getVisibleLog 캡슐화
- processQueue 파라미터에 참조 안정성 요구 JSDoc 문서화
- renderHook + fakeTimers 기반 6개 테스트 (초기 상태, 빈 큐, 1개/2개 소비, 점진적 공개, unmount 정리)

**커밋 4: resolveQueueValue**
- skillType별 exhaustive switch: attack→damage, heal→heal, defend/buff/debuff→undefined
- value 필드 타입 검증 테스트 추가 (attack=number, defend/buff=undefined)

**커밋 5: 반응형 레이아웃**
- 캐릭터 패널 `grid-cols-1 sm:grid-cols-2`, 로그 `h-32 sm:h-48`
- 결과 `text-2xl sm:text-4xl`, 액션 버튼 `justify-center`

**커밋 6: CSS 애니메이션**
- Tailwind 4 `@theme` 블록에 6개 키프레임: fade-in, slide-up, float-up, hit-flash, pulse-heal, shake
- App.tsx에서 `key={phase}` + `animate-fade-in`으로 부드러운 페이즈 전환

**커밋 7: 전투 비주얼 폴리시**
- `battle-visual-helpers.ts`: shouldShowPopup + getActiveEffect + getPopupDisplay 순수 함수
- `DamagePopup.tsx`: float-up 애니메이션 데미지/힐 팝업
- CharacterPanel: 캐릭터 이모지 (🧑‍⚔️/👹), activeEffect prop (shake/pulse-heal)
- BattleLog: 새 로그 slide-up, ResultPage: 승리 glow drop-shadow
- 22개 유닛 테스트 (shouldShowPopup 9개, getActiveEffect 9개, getPopupDisplay 6개 — 모든 스킬 타입 × 양쪽 side)

### 설계 결정

**순수 함수 우선 (round-executor.ts)**
- 스토어는 상태 업데이트만 담당. 라운드 실행 로직은 순수 함수로 분리하여 테스트 용이성 확보.
- 기존 통합 테스트(battle-store.test.ts 23개)가 executeRound를 간접 검증하므로 별도 단위 테스트 불필요.

**shouldShowPopup/getActiveEffect 분리**
- BattlePage에서 인라인 조건문이 4~5줄 중첩 ternary가 되는 것을 방지.
- 순수 함수이므로 22개 유닛 테스트로 모든 타입×side 조합 완전 커버.

### 검증 결과
- ESLint: 0 에러
- TypeScript: 0 에러
- 유닛 테스트: 173개 통과 (+29: renderHook 6 + value 검증 1 + visual helpers 22)
- E2E 테스트: 10개 통과

---

## 최종 요약

| 사이클 | 발견 | 수정 | 핵심 |
|--------|------|------|------|
| #1 | 11개 | 11개 | SPD 버그, 스냅샷 애니메이션, actorHpChange, BattleAction 유니온 |
| #2 | 24개 | 12개 | 적 fallback, ErrorBoundary, 접근성, E2E 안정성 |
| #3 | 4개 | 3개 | 후공 방어 유지, 로그 점진적 공개, MP 부족 테스트 |
| #4 | 18개 | 5개 | 효과 중첩 방지, 미사용 deps, 접근성 |
| #5 | 2개 | 2개 | 빌드 수정, 폼 버튼 타입 |
| 커버리지 | - | +16 | 라인/함수 100%, 분기 97% |
| #6 | 9개 | 5개 | executeMoverTurn DRY, 상수 통합, dead code 제거 |
| #7 | 7개 | 7개 | 순수 함수 추출, 셀렉터, 훅 추출, 반응형, 애니메이션, 비주얼 폴리시 |

**최종 수치:** 173 유닛 테스트 + 10 E2E 테스트, 빌드 성공, 린트/타입 에러 0
