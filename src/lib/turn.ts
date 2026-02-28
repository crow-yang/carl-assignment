import type { BattleResult } from '../types'
import { MAX_ROUNDS } from '../constants'

/**
 * SPD 비교로 선공 결정. 동일 시 rng로 결정.
 */
export function determineFirstMover(
  playerSpd: number,
  enemySpd: number,
  rng: () => number = Math.random,
): 'player' | 'enemy' {
  if (playerSpd > enemySpd) return 'player'
  if (enemySpd > playerSpd) return 'enemy'
  return rng() < 0.5 ? 'player' : 'enemy'
}

/**
 * 전투 종료 조건 확인.
 * - 플레이어 HP ≤ 0 → 패배
 * - 적 HP ≤ 0 → 승리
 * - 라운드 > MAX_ROUNDS → 무승부
 * - 그 외 → null (계속 진행)
 *
 * 양쪽 동시 사망 시 플레이어 HP를 먼저 확인하므로 'defeat'를 반환한다.
 * 의도: 턴제 전투에서 동시 사망은 "공격당해 죽은 쪽이 진다"는 직관에 부합한다.
 * 후공이 공격받아 사망하면 후공이 행동하기 전에 라운드가 끝나고(round-executor에서 처리),
 * 양쪽이 동일 라운드에서 사망하는 경우는 후공의 반격으로 선공도 사망한 상황이므로
 * 반격에 성공한 후공(적) 유리로 판정하는 것이 밸런스상 자연스럽다.
 */
export function checkBattleEnd(
  playerHp: number,
  enemyHp: number,
  round: number,
): BattleResult | null {
  if (playerHp <= 0) return 'defeat'
  if (enemyHp <= 0) return 'victory'
  if (round > MAX_ROUNDS) return 'draw'
  return null
}
