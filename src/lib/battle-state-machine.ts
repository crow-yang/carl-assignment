import type { BattlePhase } from '../types'

/**
 * 전투 상태 머신 전이 함수.
 *
 * 전이 다이어그램:
 *
 *   round-start ──▶ (isPlayerFirst ? player-action : enemy-action)
 *   player-action ──▶ (targetDead ? battle-end : nextMoverAction)
 *   enemy-action ──▶ (targetDead ? battle-end : nextMoverAction)
 *   round-end ──▶ (roundExceeded ? battle-end : round-start)
 *   battle-end ──▶ (terminal, 전이 없음)
 *
 *   nextMoverAction:
 *     isFirstAction이면 → 후공 행동
 *     isFirstAction 아니면 → round-end
 */

interface TransitionContext {
  isPlayerFirst: boolean
  isFirstAction: boolean  // 이번 라운드에서 첫 번째 행동인가
  targetDead: boolean     // 방금 행동의 대상이 죽었는가
  roundExceeded: boolean  // 라운드 > MAX_ROUNDS
}

export function nextPhase(
  current: BattlePhase,
  ctx: TransitionContext,
): BattlePhase {
  switch (current) {
    case 'round-start':
      return ctx.isPlayerFirst ? 'player-action' : 'enemy-action'

    case 'player-action':
      if (ctx.targetDead) return 'battle-end'
      if (ctx.isFirstAction) return 'enemy-action'
      return 'round-end'

    case 'enemy-action':
      if (ctx.targetDead) return 'battle-end'
      if (ctx.isFirstAction) return 'player-action'
      return 'round-end'

    case 'round-end':
      if (ctx.roundExceeded) return 'battle-end'
      return 'round-start'

    case 'battle-end':
      return 'battle-end' // terminal
  }
}
