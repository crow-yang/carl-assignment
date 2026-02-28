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
