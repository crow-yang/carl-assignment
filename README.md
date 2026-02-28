# 턴제 배틀 게임

턴제 1:1 전투 게임입니다. 캐릭터 세팅(이름/스탯/스킬/난이도) → 전투 → 결과 흐름으로 진행됩니다.

## 실행 방법

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev

# 유닛 테스트
npm test

# E2E 테스트
npx playwright install chromium
npx playwright test
```

## 기술 스택

| 카테고리 | 기술 | 선택 이유 |
|---------|------|----------|
| 프레임워크 | React 19 + TypeScript | 평가자 가독성, 타입 안전 |
| 빌드 | Vite 7 | HMR 100ms 이하, ESM 네이티브 |
| 상태 관리 | Zustand | 보일러플레이트 최소, 게임 상태에 적합 |
| 스타일링 | Tailwind CSS v4 | 유틸리티 퍼스트, 런타임 0 |
| 폼 검증 | React Hook Form + Zod v4 | 런타임 검증 + 타입 추론 |
| 유닛 테스트 | Vitest | Vite 네이티브, Jest 대비 10x 빠름 |
| E2E | Playwright | 안정적, data-testid 네이티브 |

자세한 선정 근거는 [dev-log/001-tech-stack-and-architecture.md](dev-log/001-tech-stack-and-architecture.md) 참조.

## 아키텍처

```
src/
├── types/          # 도메인 타입 (Skill, Character, BattleState 등)
├── constants/      # 게임 상수 (스탯 범위, 적 데이터, 기본 스킬)
├── schemas/        # Zod 검증 스키마
├── lib/            # 순수 함수 게임 로직 (UI 무관, 100% 테스트)
│   ├── damage.ts              # 데미지 공식
│   ├── effects.ts             # 버프/디버프 적용/만료
│   ├── skill-executor.ts      # 스킬 타입별 실행
│   ├── turn.ts                # 선공 판정, 전투 종료
│   ├── battle-state-machine.ts # 명시적 상태 전이
│   ├── action-queue.ts        # 액션 큐 (불변 FIFO)
│   ├── enemy-ai.ts            # 적 AI (rng 주입)
│   └── validation.ts          # 스탯/스킬 검증
├── stores/         # Zustand 상태 관리
│   ├── game-store.ts    # 게임 페이즈 (setup → battle → result)
│   ├── setup-store.ts   # 세팅 상태
│   └── battle-store.ts  # 전투 오케스트레이션
├── features/       # UI 컴포넌트 (페이지별)
│   ├── setup/      # 세팅 (3스텝 폼)
│   ├── battle/     # 전투 (캐릭터패널, 액션패널, 로그)
│   └── result/     # 결과 (승패, 턴수, 재시작)
└── App.tsx         # 페이즈 라우팅
```

## 핵심 설계 결정

### 1. 순수 함수 게임 로직 분리

모든 게임 로직을 `lib/`에 순수 함수로 구현했습니다. UI 프레임워크와 완전히 독립적이어서:
- 테스트가 즉각적 (133개 유닛 테스트, < 1초)
- 로직 변경 시 UI 변경 불필요 (관심사 분리)
- 모든 분기 조건을 결정적으로 검증 가능

### 2. 명시적 상태 머신

전투 흐름을 `nextPhase(current, context)` 순수 함수로 정의했습니다. if/else 분산 대신 명시적 전이 테이블로 관리하여 전이 버그를 원천 차단합니다.

### 3. 액션 큐 패턴

한 라운드의 결과(선공 행동 → 후공 행동)를 큐에 적재하고, UI가 순차적으로 소비하며 연출합니다. 이를 통해 동기적 게임 로직과 비동기 UI 연출을 깔끔하게 분리합니다.

### 4. rng 의존성 주입

적 AI의 랜덤 함수를 파라미터로 주입합니다 (`decideEnemyAction(context, rng = Math.random)`). 프로덕션에서는 기본값 사용, 테스트에서는 고정 값 주입으로 결정적 테스트를 보장합니다.

## 테스트

| 종류 | 파일 수 | 테스트 수 | 내용 |
|------|--------|----------|------|
| 유닛 | 11 | 133 | 게임 로직 + 스토어 |
| E2E | 3 | 10 | 세팅/전투/풀플로우 |

```bash
# 유닛 테스트 실행
npm test

# E2E 테스트 실행
npx playwright test

# 린트
npm run lint
```

## 개발 일지

구현 과정, 기술 선택 근거, 트러블슈팅 내역을 `dev-log/` 디렉토리에 기록하고 있습니다:

- [001-tech-stack-and-architecture.md](dev-log/001-tech-stack-and-architecture.md) — 기술 스택 선정 이유 + 아키텍처 결정
- [002-implementation.md](dev-log/002-implementation.md) — 구현 과정 + 트러블슈팅 + 테스트 현황
