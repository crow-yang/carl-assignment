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

    // ─── 스킬 결정 ───────────────────────────────
    const playerSkill = resolveSkill(player, action)
    if (!playerSkill) return

    const enemyAction = decideEnemyAction(enemy, player, difficulty)
    const enemySkill = resolveSkill(enemy, enemyAction)
      ?? enemy.skills.find((s) => s.type === 'attack' && s.isDefault)
      ?? null
    if (!enemySkill) return

    // ─── 선공/후공 순서 결정 ─────────────────────
    const [firstSide, firstSkill, secondSide, secondSkill] = isPlayerFirst
      ? ['player' as const, playerSkill, 'enemy' as const, enemySkill]
      : ['enemy' as const, enemySkill, 'player' as const, playerSkill]

    let updatedPlayer = { ...player }
    let updatedEnemy = { ...enemy }
    let playerDefending = false
    let enemyDefending = false
    const queueItems: ActionQueueItem[] = []
    const logEntries: TurnLogEntry[] = []

    // ─── 선공 실행 ───────────────────────────────
    const first = executeMoverTurn(
      updatedPlayer, updatedEnemy, firstSkill, firstSide, round,
      firstSide === 'player' ? enemyDefending : playerDefending,
    )
    updatedPlayer = first.player
    updatedEnemy = first.enemy
    if (firstSide === 'player') playerDefending = first.isDefending
    else enemyDefending = first.isDefending
    queueItems.push(first.queueItem)
    logEntries.push(first.logEntry)

    // 선공 후 사망 확인
    const midResult = checkBattleEnd(updatedPlayer.currentHp, updatedEnemy.currentHp, round)
    if (midResult) {
      set({
        battleState: makeBattleEndState(battleState, updatedPlayer, updatedEnemy, playerDefending, enemyDefending, logEntries, midResult),
        actionQueue: queueItems,
      })
      return
    }

    // ─── 후공 실행 ───────────────────────────────
    const second = executeMoverTurn(
      updatedPlayer, updatedEnemy, secondSkill, secondSide, round,
      secondSide === 'player' ? enemyDefending : playerDefending,
    )
    updatedPlayer = second.player
    updatedEnemy = second.enemy
    if (secondSide === 'player') playerDefending = second.isDefending
    else enemyDefending = second.isDefending
    queueItems.push(second.queueItem)
    logEntries.push(second.logEntry)

    // 후공 후 사망 확인
    const endResult = checkBattleEnd(updatedPlayer.currentHp, updatedEnemy.currentHp, round)
    if (endResult) {
      set({
        battleState: makeBattleEndState(battleState, updatedPlayer, updatedEnemy, playerDefending, enemyDefending, logEntries, endResult),
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
        // 후공의 방어는 다음 라운드 선공의 공격에 대해 유효 (1라운드 지속)
        playerDefending: secondSide === 'player' ? playerDefending : false,
        enemyDefending: secondSide === 'enemy' ? enemyDefending : false,
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
  playerDefending: boolean,
  enemyDefending: boolean,
  logEntries: TurnLogEntry[],
  result: BattleResult,
): BattleState {
  return {
    ...battleState,
    player,
    enemy,
    playerDefending,
    enemyDefending,
    phase: 'battle-end',
    log: [...battleState.log, ...logEntries],
    result,
  }
}

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
