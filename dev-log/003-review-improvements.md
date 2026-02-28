# 003 — 코드 리뷰 감점사항 보완

## 배경

코드 리뷰(자체 채점 88/100)에서 발견된 9개 감점사항을 보완했다.

## 수정 목록

| # | 감점 | 수정 내용 | 파일 |
|---|------|----------|------|
| 1 | README에 미사용 React Hook Form 기재 (-2) | "React Hook Form + Zod v4" → "Zod v4" | README.md |
| 2 | 미사용 devDependency (-1) | `@testing-library/user-event` 제거 | package.json |
| 3 | rng가 executeRound에서 전달되지 않음 (-1) | `rng?: () => number` 파라미터 추가, decideEnemyAction에 전달 | round-executor.ts |
| 4 | 상태 머신 1곳만 사용 (-1) | 선공/후공 사망 + 라운드종료 3곳 모두 `nextPhase()` 사용 | round-executor.ts |
| 5 | effect-expire 타입만 정의, 생성 안 됨 (-1) | `findExpiringEffects` + `makeExpireItems` 구현 | effects.ts, round-executor.ts |
| 6 | 후공 방어 carry 미문서화 (-1) | 코드 주석 + README §5 설계 결정 추가 | round-executor.ts, README.md |
| 7 | 난이도 버튼 aria-pressed 누락 (-1) | `aria-pressed={isSelected}` 추가 | Step3Difficulty.tsx |
| 8 | 캐릭터 비주얼이 이모지뿐 (-1) | 인라인 SVG 아바타 (슬라임/오크/드래곤) | CharacterPanel.tsx |
| 9 | round-executor 테스트 4개뿐 (-1) | +8 (rng, 전투종료, expire, 방어carry) + effects +3 | round-executor.test.ts, effects.test.ts |

## 설계 결정

### effect-expire 감지 방식

`tickEffects` 반환값을 변경하는 대신 별도 `findExpiringEffects` 헬퍼를 추가했다. 기존 API를 유지하면서 minimal diff로 기능을 추가하는 방식.

```
findExpiringEffects(effects)   // tick 전: remainingTurns === 1 필터
tickEffects(effects)            // tick: remainingTurns-- → 0이면 제거
```

### 상태 머신 활용 확대

기존에는 라운드 종료 시 1곳에서만 `nextPhase()`를 호출했다. 선공/후공 사망 시에는 `'battle-end'`를 하드코딩. 이를 3곳 모두 `nextPhase()`를 통하도록 변경하여, 상태 전이의 단일 소스(single source of truth)를 확보.

`makeBattleEndState`에 `phase: BattlePhase` 파라미터를 추가하여 호출부에서 상태 머신이 결정한 phase를 주입.

### SVG 아바타

별도 파일 추출 대신 CharacterPanel.tsx 상단에 상수로 정의. 과제 규모에서 별도 파일은 과도한 추상화. 적 이름으로 매핑 + fallback SVG 패턴.

## 결과

- 테스트: 181 → 192 (전체 통과)
- 린트: 0 errors
- 빌드: 성공 (296KB, gzip 89KB)
