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
