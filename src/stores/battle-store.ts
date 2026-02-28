import { create } from 'zustand'
import type {
  Character, BattleState, BattleAction, BattleResult,
  Difficulty, Skill, ActionQueueItem, TurnLogEntry, Stats,
} from '../types'
import { ENEMY_STATS, ENEMY_NAMES, ENEMY_SKILLS } from '../constants'
import { executeSkill, type SkillExecutionResult } from '../lib/skill-executor'
import { tickEffects, resetEffectIdCounter } from '../lib/effects'
import { determineFirstMover, checkBattleEnd } from '../lib/turn'
import { decideEnemyAction } from '../lib/enemy-ai'
import { nextPhase } from '../lib/battle-state-machine'

interface BattleStoreState {
  battleState: BattleState | null
  difficulty: Difficulty | null
  actionQueue: ActionQueueItem[]
}

interface BattleStoreActions {
  initBattle: (playerName: string, playerStats: Stats, playerSkills: Skill[], difficulty: Difficulty) => void
  executePlayerAction: (action: BattleAction) => void
  processQueue: () => ActionQueueItem | null
  getResult: () => { result: BattleResult; totalRounds: number } | null
  reset: () => void
}

const initialState: BattleStoreState = {
  battleState: null,
  difficulty: null,
  actionQueue: [],
}

export const useBattleStore = create<BattleStoreState & BattleStoreActions>((set, get) => ({
  ...initialState,

  initBattle: (playerName, playerStats, playerSkills, difficulty) => {
    const enemyStats = ENEMY_STATS[difficulty]
    const player: Character = {
      name: playerName,
      baseStats: playerStats,
      currentHp: playerStats.hp,
      currentMp: playerStats.mp,
      skills: playerSkills,
      activeEffects: [],
    }
    const enemy: Character = {
      name: ENEMY_NAMES[difficulty],
      baseStats: enemyStats,
      currentHp: enemyStats.hp,
      currentMp: enemyStats.mp,
      skills: ENEMY_SKILLS[difficulty],
      activeEffects: [],
    }

    // SPD는 버프/디버프 대상이 아니므로 base값을 그대로 사용
    const isPlayerFirst = determineFirstMover(playerStats.spd, enemyStats.spd) === 'player'

    const battleState: BattleState = {
      round: 1,
      player,
      enemy,
      playerDefending: false,
      enemyDefending: false,
      isPlayerFirst,
      phase: 'player-action', // 항상 플레이어가 먼저 입력 (UI 흐름)
      log: [],
      result: null,
    }

    set({ battleState, difficulty, actionQueue: [] })
  },

  executePlayerAction: (action) => {
    const state = get()
    const { battleState, difficulty } = state
    if (!battleState || battleState.result || !difficulty) return
    const { player, enemy, round, isPlayerFirst } = battleState
    const queueItems: ActionQueueItem[] = []
    const logEntries: TurnLogEntry[] = []

    let updatedPlayer = { ...player }
    let updatedEnemy = { ...enemy }
    let playerDefending = false
    let enemyDefending = false

    // ─── 플레이어 스킬 결정 ────────────────────────
    const playerSkill = resolveSkill(player, action)
    if (!playerSkill) return

    // ─── 적 행동 결정 (MP 부족 시 기본공격 fallback) ──
    const enemyAction = decideEnemyAction(updatedEnemy, updatedPlayer, difficulty)
    const enemySkill = resolveSkill(enemy, enemyAction)
      ?? enemy.skills.find((s) => s.type === 'attack' && s.isDefault)
      ?? null
    if (!enemySkill) return

    // ─── 선공/후공 순서로 실행 ─────────────────────
    const firstAction = isPlayerFirst
      ? { actor: updatedPlayer, target: updatedEnemy, skill: playerSkill, side: 'player' as const }
      : { actor: updatedEnemy, target: updatedPlayer, skill: enemySkill, side: 'enemy' as const }

    const secondAction = isPlayerFirst
      ? { actor: updatedEnemy, target: updatedPlayer, skill: enemySkill, side: 'enemy' as const }
      : { actor: updatedPlayer, target: updatedEnemy, skill: playerSkill, side: 'player' as const }

    // 선공 실행
    const firstResult = executeSkill(
      firstAction.actor, firstAction.target, firstAction.skill,
      round, firstAction.side,
      firstAction.side === 'player' ? enemyDefending : playerDefending,
    )

    // 선공 결과 반영
    if (firstAction.side === 'player') {
      playerDefending = firstResult.isDefending
      updatedPlayer = applyActorResult(updatedPlayer, firstResult)
      updatedEnemy = applyTargetResult(updatedEnemy, firstResult)
    } else {
      enemyDefending = firstResult.isDefending
      updatedEnemy = applyActorResult(updatedEnemy, firstResult)
      updatedPlayer = applyTargetResult(updatedPlayer, firstResult)
    }

    queueItems.push(toQueueItem(firstResult.logEntry, firstAction.side, updatedPlayer, updatedEnemy))
    logEntries.push(firstResult.logEntry)

    // 선공 후 사망 확인
    const midResult = checkBattleEnd(updatedPlayer.currentHp, updatedEnemy.currentHp, round)
    if (midResult) {
      set({
        battleState: {
          ...battleState,
          player: updatedPlayer,
          enemy: updatedEnemy,
          playerDefending,
          enemyDefending,
          phase: 'battle-end',
          log: [...battleState.log, ...logEntries],
          result: midResult,
        },
        actionQueue: queueItems,
      })
      return
    }

    // 후공 실행
    // 후공의 actor/target도 업데이트된 상태 사용
    const secondActor = secondAction.side === 'player' ? updatedPlayer : updatedEnemy
    const secondTarget = secondAction.side === 'player' ? updatedEnemy : updatedPlayer
    const secondResult = executeSkill(
      secondActor, secondTarget, secondAction.skill,
      round, secondAction.side,
      secondAction.side === 'player' ? enemyDefending : playerDefending,
    )

    // 후공 결과 반영
    if (secondAction.side === 'player') {
      playerDefending = secondResult.isDefending
      updatedPlayer = applyActorResult(updatedPlayer, secondResult)
      updatedEnemy = applyTargetResult(updatedEnemy, secondResult)
    } else {
      enemyDefending = secondResult.isDefending
      updatedEnemy = applyActorResult(updatedEnemy, secondResult)
      updatedPlayer = applyTargetResult(updatedPlayer, secondResult)
    }

    queueItems.push(toQueueItem(secondResult.logEntry, secondAction.side, updatedPlayer, updatedEnemy))
    logEntries.push(secondResult.logEntry)

    // 후공 후 사망 확인
    const endResult = checkBattleEnd(updatedPlayer.currentHp, updatedEnemy.currentHp, round)
    if (endResult) {
      set({
        battleState: {
          ...battleState,
          player: updatedPlayer,
          enemy: updatedEnemy,
          playerDefending,
          enemyDefending,
          phase: 'battle-end',
          log: [...battleState.log, ...logEntries],
          result: endResult,
        },
        actionQueue: queueItems,
      })
      return
    }

    // ─── 라운드 종료: 효과 틱 + 다음 라운드 ───────
    updatedPlayer = { ...updatedPlayer, activeEffects: tickEffects(updatedPlayer.activeEffects) }
    updatedEnemy = { ...updatedEnemy, activeEffects: tickEffects(updatedEnemy.activeEffects) }

    const nextRound = round + 1
    const roundEndResult = checkBattleEnd(updatedPlayer.currentHp, updatedEnemy.currentHp, nextRound)
    const newIsPlayerFirst = determineFirstMover(
      updatedPlayer.baseStats.spd,
      updatedEnemy.baseStats.spd,
    ) === 'player'

    const newPhase = roundEndResult
      ? 'battle-end' as const
      : nextPhase('round-end', { isPlayerFirst: newIsPlayerFirst, isFirstAction: false, targetDead: false, roundExceeded: false })

    set({
      battleState: {
        round: roundEndResult ? round : nextRound,
        player: updatedPlayer,
        enemy: updatedEnemy,
        playerDefending: false,
        enemyDefending: false,
        isPlayerFirst: newIsPlayerFirst,
        phase: newPhase,
        log: [...battleState.log, ...logEntries],
        result: roundEndResult,
      },
      actionQueue: queueItems,
    })
  },

  processQueue: () => {
    const { actionQueue } = get()
    if (actionQueue.length === 0) return null
    const [item, ...remaining] = actionQueue
    set({ actionQueue: remaining })
    return item
  },

  getResult: () => {
    const { battleState } = get()
    if (!battleState?.result) return null
    return { result: battleState.result, totalRounds: battleState.round }
  },

  reset: () => {
    resetEffectIdCounter()
    set({ ...initialState })
  },
}))

// ─── 헬퍼 함수들 ───────────────────────────────────────────

function resolveSkill(character: Character, action: BattleAction): Skill | null {
  if (action.type === 'attack') {
    return character.skills.find((s) => s.type === 'attack' && s.isDefault) ?? null
  }
  if (action.type === 'defend') {
    return character.skills.find((s) => s.type === 'defend') ?? null
  }
  if (action.type === 'skill' && action.skillId) {
    const skill = character.skills.find((s) => s.id === action.skillId)
    if (skill && character.currentMp >= skill.mpCost) return skill
  }
  return null
}

function applyActorResult(actor: Character, result: SkillExecutionResult): Character {
  return {
    ...actor,
    currentHp: Math.min(actor.baseStats.hp, actor.currentHp + result.actorHpChange),
    currentMp: Math.max(0, actor.currentMp + result.actorMpChange),
    activeEffects: result.newActorEffects,
  }
}

function applyTargetResult(target: Character, result: SkillExecutionResult): Character {
  return {
    ...target,
    currentHp: Math.max(0, target.currentHp + result.targetHpChange),
    activeEffects: result.newTargetEffects,
  }
}

function determineQueueItemType(logEntry: TurnLogEntry): ActionQueueItem['type'] {
  switch (logEntry.skillType) {
    case 'attack': return 'damage'
    case 'heal': return 'heal'
    case 'defend': return 'defend'
    case 'buff': return 'buff'
    case 'debuff': return 'debuff'
  }
}

function toQueueItem(
  logEntry: TurnLogEntry,
  side: 'player' | 'enemy',
  playerSnapshot: Character,
  enemySnapshot: Character,
): ActionQueueItem {
  return {
    type: determineQueueItemType(logEntry),
    actor: side,
    actorName: logEntry.actorName,
    description: logEntry.action,
    value: logEntry.damage ?? logEntry.heal,
    logEntry,
    playerSnapshot,
    enemySnapshot,
  }
}
