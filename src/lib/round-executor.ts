import type {
  Character, BattleState, BattleAction, BattleResult, BattlePhase,
  Difficulty, Skill, ActionQueueItem, TurnLogEntry,
} from '../types'
import { executeSkill } from './skill-executor'
import { tickEffects, findExpiringEffects } from './effects'
import { determineFirstMover, checkBattleEnd } from './turn'
import { decideEnemyAction } from './enemy-ai'
import { nextPhase } from './battle-state-machine'
import {
  resolveSkill, applyActorResult, applyTargetResult,
  toQueueItem, makeExpireItems,
} from './round-helpers'

/**
 * 라운드 실행 순수 함수.
 *
 * 실행 플로우:
 *
 *   executeRound(battleState, playerAction, difficulty, rng?)
 *     ├─ resolveSkill(player, playerAction) → playerSkill
 *     ├─ decideEnemyAction → resolveSkill → enemySkill
 *     ├─ isPlayerFirst? → 선공/후공 순서 결정
 *     │
 *     ├─ executeMoverTurn(first)
 *     │    └─ executeSkill → applyActor/Target → toQueueItem
 *     ├─ checkBattleEnd → 사망 시 early return
 *     │
 *     ├─ executeMoverTurn(second)
 *     │    └─ executeSkill → applyActor/Target → toQueueItem
 *     ├─ checkBattleEnd → 사망 시 early return
 *     │
 *     ├─ findExpiringEffects (양쪽) → 만료 큐 아이템 생성
 *     ├─ tickEffects (양쪽)
 *     ├─ checkBattleEnd → 20턴 초과 확인
 *     └─ determineFirstMover (다음 라운드)
 *     ← { battleState, actionQueue }
 */

export interface RoundExecutionResult {
  battleState: BattleState
  actionQueue: ActionQueueItem[]
}

export function executeRound(
  battleState: BattleState,
  playerAction: BattleAction,
  difficulty: Difficulty,
  rng?: () => number,
): RoundExecutionResult | null {
  if (battleState.result) return null

  const { player, enemy, round, isPlayerFirst } = battleState

  // ─── 스킬 결정 ───────────────────────────────
  const playerSkill = resolveSkill(player, playerAction)
  if (!playerSkill) return null

  const enemyAction = decideEnemyAction(enemy, player, difficulty, rng)
  const enemySkill = resolveSkill(enemy, enemyAction)
    ?? enemy.skills.find((s) => s.type === 'attack' && s.isDefault)
    ?? null
  if (!enemySkill) return null

  // ─── 선공/후공 순서 결정 ─────────────────────
  const [firstSide, firstSkill, secondSide, secondSkill] = isPlayerFirst
    ? ['player' as const, playerSkill, 'enemy' as const, enemySkill]
    : ['enemy' as const, enemySkill, 'player' as const, playerSkill]

  let updatedPlayer = { ...player }
  let updatedEnemy = { ...enemy }
  const queueItems: ActionQueueItem[] = []
  const logEntries: TurnLogEntry[] = []

  // ─── 방어 상태 사전 결정 (양측 동시 선언) ─────
  // "이번 턴 받는 피해 50% 감소" — 양쪽의 행동 선택은 동시에 이루어지므로,
  // 후공이 방어를 선택해도 같은 라운드 선공의 공격에 대해 방어가 적용된다.
  const playerDefending = playerSkill.type === 'defend'
  const enemyDefending = enemySkill.type === 'defend'

  // ─── 선공 실행 ───────────────────────────────
  const first = executeMoverTurn(
    updatedPlayer, updatedEnemy, firstSkill, firstSide, round,
    firstSide === 'player' ? enemyDefending : playerDefending,
  )
  updatedPlayer = first.player
  updatedEnemy = first.enemy
  queueItems.push(first.queueItem)
  logEntries.push(first.logEntry)

  // 선공 후 사망 확인
  const midResult = checkBattleEnd(updatedPlayer.currentHp, updatedEnemy.currentHp, round)
  if (midResult) {
    const midPhase = nextPhase(
      isPlayerFirst ? 'player-action' : 'enemy-action',
      { isPlayerFirst, isFirstAction: true, targetDead: true, roundExceeded: false },
    )
    return {
      battleState: makeBattleEndState(battleState, updatedPlayer, updatedEnemy, logEntries, midResult, midPhase),
      actionQueue: queueItems,
    }
  }

  // ─── 후공 실행 ───────────────────────────────
  const second = executeMoverTurn(
    updatedPlayer, updatedEnemy, secondSkill, secondSide, round,
    secondSide === 'player' ? enemyDefending : playerDefending,
  )
  updatedPlayer = second.player
  updatedEnemy = second.enemy
  queueItems.push(second.queueItem)
  logEntries.push(second.logEntry)

  // 후공 후 사망 확인
  const endResult = checkBattleEnd(updatedPlayer.currentHp, updatedEnemy.currentHp, round)
  if (endResult) {
    const endPhase = nextPhase(
      isPlayerFirst ? 'enemy-action' : 'player-action',
      { isPlayerFirst, isFirstAction: false, targetDead: true, roundExceeded: false },
    )
    return {
      battleState: makeBattleEndState(battleState, updatedPlayer, updatedEnemy, logEntries, endResult, endPhase),
      actionQueue: queueItems,
    }
  }

  // ─── 라운드 종료: 만료 감지 → 효과 틱 → 다음 라운드 ───────
  const expiredPlayer = findExpiringEffects(updatedPlayer.activeEffects)
  const expiredEnemy = findExpiringEffects(updatedEnemy.activeEffects)

  updatedPlayer = { ...updatedPlayer, activeEffects: tickEffects(updatedPlayer.activeEffects) }
  updatedEnemy = { ...updatedEnemy, activeEffects: tickEffects(updatedEnemy.activeEffects) }

  const expireItems = [
    ...makeExpireItems(expiredPlayer, 'player', updatedPlayer.name, round, updatedPlayer, updatedEnemy),
    ...makeExpireItems(expiredEnemy, 'enemy', updatedEnemy.name, round, updatedPlayer, updatedEnemy),
  ]
  queueItems.push(...expireItems.map((i) => i.queueItem))
  logEntries.push(...expireItems.map((i) => i.logEntry))

  const nextRound = round + 1
  const roundEndResult = checkBattleEnd(updatedPlayer.currentHp, updatedEnemy.currentHp, nextRound)
  const newIsPlayerFirst = determineFirstMover(
    updatedPlayer.baseStats.spd,
    updatedEnemy.baseStats.spd,
  ) === 'player'

  const newPhase = nextPhase('round-end', {
    isPlayerFirst: newIsPlayerFirst,
    isFirstAction: false,
    targetDead: false,
    roundExceeded: !!roundEndResult,
  })

  return {
    battleState: {
      round: roundEndResult ? round : nextRound,
      player: updatedPlayer,
      enemy: updatedEnemy,
      isPlayerFirst: newIsPlayerFirst,
      phase: newPhase,
      log: [...battleState.log, ...logEntries],
      result: roundEndResult,
    },
    actionQueue: queueItems,
  }
}

// ─── 내부 헬퍼 ──────────────────────────────────────────

/**
 * 선공/후공 한 턴 실행: 스킬 적용 → 캐릭터 상태 업데이트 → 큐 아이템 생성.
 * 선공/후공 모두 동일한 패턴이므로 공통 추출.
 */
function executeMoverTurn(
  player: Character,
  enemy: Character,
  skill: Skill,
  side: 'player' | 'enemy',
  round: number,
  opponentDefending: boolean,
) {
  const actor = side === 'player' ? player : enemy
  const target = side === 'player' ? enemy : player

  const result = executeSkill(actor, target, skill, round, side, opponentDefending)

  const updatedActor = applyActorResult(actor, result)
  const updatedTarget = applyTargetResult(target, result)
  const updatedPlayer = side === 'player' ? updatedActor : updatedTarget
  const updatedEnemy = side === 'player' ? updatedTarget : updatedActor

  return {
    player: updatedPlayer,
    enemy: updatedEnemy,
    isDefending: result.isDefending,
    logEntry: result.logEntry,
    queueItem: toQueueItem(result.logEntry, side, updatedPlayer, updatedEnemy),
  }
}

/** 전투 종료 상태 생성 (선공/후공 사망 시 공통) */
function makeBattleEndState(
  battleState: BattleState,
  player: Character,
  enemy: Character,
  logEntries: TurnLogEntry[],
  result: BattleResult,
  phase: BattlePhase,
): BattleState {
  return {
    ...battleState,
    player,
    enemy,
    phase,
    log: [...battleState.log, ...logEntries],
    result,
  }
}
