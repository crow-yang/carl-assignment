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
