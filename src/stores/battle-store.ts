// 라운드 실행은 lib/round-executor.ts에 위임. 이 스토어는 Zustand 상태 업데이트만 담당.
import { create } from 'zustand'
import type {
  Character, BattleState, BattleAction, BattleResult,
  Difficulty, Skill, ActionQueueItem, Stats,
} from '../types'
import { ENEMY_STATS, ENEMY_NAMES, ENEMY_SKILLS } from '../constants'
import { determineFirstMover } from '../lib/turn'
import { executeRound } from '../lib/round-executor'

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
    const { battleState, difficulty } = get()
    if (!battleState || !difficulty) return
    const result = executeRound(battleState, action, difficulty)
    if (result) set({ battleState: result.battleState, actionQueue: result.actionQueue })
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
    set({ ...initialState })
  },
}))
