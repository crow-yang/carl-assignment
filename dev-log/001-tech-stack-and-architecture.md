# 001. 기술 스택 선정 및 아키텍처 설계

> 작성일: 2026-02-28

## 기술 스택 선정

### 프레임워크: React 19 + TypeScript + Vite

**선정 근거:**
- 평가자가 가장 익숙할 확률이 높은 프레임워크 (시장 점유율 1위)
- TypeScript strict 모드로 게임 상태의 복잡한 타입을 안전하게 관리
- Vite는 CRA(레거시화)를 대체한 사실상 표준 빌드 도구. HMR 100ms 이하

**대안 고려:**
- Vue/Svelte: 성능은 좋지만 평가자 가독성에서 React 대비 불리
- Next.js: SSR이 게임에 불필요, CSR SPA로 충분

### 상태 관리: Zustand

**선정 근거:**
- Redux 대비 보일러플레이트 90% 감소 (action/reducer 체계 없음)
- 게임 상태 특성(HP/MP/버프 빈번한 업데이트)에 직관적인 API
- 번들 사이즈 ~2KB로 매우 가벼움
- TypeScript 네이티브 지원

**대안 고려:**
- Redux Toolkit: 안정적이나 이 규모에서 과잉 보일러플레이트
- Jotai: 원자적 상태에 좋지만 게임의 "하나의 큰 상태 객체" 패턴에 Zustand이 더 적합
- Context API: 잦은 업데이트 시 불필요한 리렌더링 발생

### 스타일링: Tailwind CSS

**선정 근거:**
- 유틸리티 퍼스트로 빠른 UI 구현
- 빌드 시 사용하지 않는 클래스 제거 (퍼지)
- 런타임 오버헤드 0 (CSS-in-JS 대비 장점)

### 폼 관리: React Hook Form + Zod

**선정 근거:**
- 3단계 스텝 폼에서 검증 로직을 타입 안전하게 관리
- Zod로 런타임 검증 + TypeScript 타입 추론 동시 달성
- **중요: Zustand가 단일 소스, RHF는 검증 전용** (리뷰에서 합의)

### 테스트: Vitest + Playwright

**선정 근거:**
- Vitest: Jest 대비 10배 빠름, Vite 설정 공유, TS 네이티브
- Playwright: data-testid 네이티브 지원, Cypress 대비 23% 빠름, 플레이키 테스트 1.8% (Cypress 6.5%)

---

## 아키텍처 결정 (리뷰 합의)

### 1. 순수 함수 상태 머신 (lib/battle-state-machine.ts)

**문제:** 전투 흐름이 if/else로 분산되면 전이 버그 발생 위험
**결정:** `nextPhase(currentPhase, context)` 순수 함수로 모든 전이를 명시
**근거:** 테스트에서 모든 전이 경로를 검증 가능

### 2. Zustand 단일 소스 오브 트루스

**문제:** RHF와 Zustand 사이 데이터 동기화 시 desync 버그
**결정:** `useForm({ values: store.state })`로 Zustand를 직접 바인딩
**근거:** 진실의 원천이 1개여야 스텝 이동 시 값 보존이 보장됨

### 3. 액션 큐 패턴

**문제:** 전투 결과를 한번에 업데이트하면 연출/애니메이션 불가
**결정:** 라운드 실행 → 결과를 큐에 적재 → UI가 순차 소비하며 연출
**근거:** 게임 로직(동기)과 UI 연출(비동기)을 깔끔하게 분리

### 4. 적 AI rng 의존성 주입

**문제:** Math.random() 직접 사용 시 테스트 비결정적
**결정:** `decideEnemyAction(context, rng = Math.random)` 형태로 기본값 제공
**근거:** 1줄 파라미터 추가로 테스트가 완전히 결정적

### 5. buff/debuff 타입 통합

**문제:** BuffSkill과 DebuffSkill의 필드가 완전히 동일 (DRY 위반)
**결정:** StatusEffectSkill로 통합, type: 'buff' | 'debuff'로 구분
**근거:** 중복 제거, 변경 시 1곳만 수정

### 6. 파일 구조 최적화

**문제:** 50개 파일은 3화면 게임에 과잉 분리
**결정:** types/, constants/ 단일 파일, setup/ step별 1파일(+SkillForm 분리) → ~30파일
**근거:** 300줄 제한은 유지하되 불필요한 파일 분리 방지

---

## 프롬프팅 기록

### 프롬프트 1: 기술 스택 리서치
- 요청: 2026년 현재 턴제 배틀 게임 SPA에 최적인 기술 스택 리서치
- 결과: React+TS+Vite+Zustand+Tailwind+RHF+Zod+Vitest+Playwright 조합 도출
- 각 선택지별 벤치마크 데이터 포함 (Vitest 1.8초 vs Jest 18.7초 등)

### 프롬프트 2: 아키텍처 설계
- 요청: 디렉토리 구조, 타입 시스템, 상태 관리, 게임 로직, 컴포넌트 구조, 구현 순서
- 결과: 50개 파일 구조 초안 → 리뷰 후 30개로 축소

### 리뷰 과정
- Step 0 (Scope Challenge): 사용자 BIG CHANGE 선택
- Architecture Review: 4개 이슈 (상태머신, RHF sync, 액션큐, AI rng) → 모두 A 선택
- Code Quality Review: 4개 이슈 (타입통합, 상수통합, buff통합, setup축소) → 모두 추천안 선택
- Test Review: 4개 갭 발견 → 모두 추가
- Performance Review: selector 컨벤션만 적용
