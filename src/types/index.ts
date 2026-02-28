// ─── Game Phase ─────────────────────────────────────────────
export type GamePhase = 'setup' | 'battle' | 'result'
export type Difficulty = 'easy' | 'normal' | 'hard'

// ─── Stats ──────────────────────────────────────────────────
export type StatType = 'hp' | 'mp' | 'atk' | 'def' | 'spd'
export type BuffTargetStat = 'atk' | 'def'

export interface Stats {
  hp: number
  mp: number
  atk: number
  def: number
  spd: number
}

export interface StatRange {
  min: number
  max: number
}

// ─── Skills ─────────────────────────────────────────────────
//
// Skill 타입 계층:
//   Skill = AttackSkill | DefendSkill | HealSkill | StatusEffectSkill
//
// buff/debuff는 구조가 동일하므로 StatusEffectSkill로 통합 (DRY).
// type 필드의 'buff' | 'debuff'로 방향(자신/상대)을 구분한다.

export interface BaseSkill {
  id: string
  name: string
  mpCost: number
  isDefault: boolean
}

export interface AttackSkill extends BaseSkill {
  type: 'attack'
  multiplier: number // 1.0 ~ 3.0
}

export interface DefendSkill extends BaseSkill {
  type: 'defend'
}

export interface HealSkill extends BaseSkill {
  type: 'heal'
  healAmount: number // 10 ~ 50
}

export interface StatusEffectSkill extends BaseSkill {
  type: 'buff' | 'debuff'
  targetStat: BuffTargetStat
  amount: number   // 1 ~ 10
  duration: number // 1 ~ 5 턴
}

export type Skill = AttackSkill | DefendSkill | HealSkill | StatusEffectSkill
export type SkillType = Skill['type']
export type CustomSkillType = Exclude<SkillType, 'defend'>

// ─── Active Effects (버프/디버프) ───────────────────────────
export interface ActiveEffect {
  id: string
  type: 'buff' | 'debuff'
  targetStat: BuffTargetStat
  amount: number
  remainingTurns: number
  sourceName: string // 어떤 스킬에서 왔는지 (로그용)
}

// ─── Character ──────────────────────────────────────────────
export interface Character {
  name: string
  baseStats: Stats
  currentHp: number
  currentMp: number
  skills: Skill[]
  activeEffects: ActiveEffect[]
}

// ─── Battle ─────────────────────────────────────────────────
//
// 전투 상태 흐름 (State Machine):
//
//   ROUND_START
//     → determineFirstMover(playerSPD, enemySPD)
//     → FIRST_MOVER_ACTION
//       → HP ≤ 0? → BATTLE_END
//     → SECOND_MOVER_ACTION
//       → HP ≤ 0? → BATTLE_END
//     → ROUND_END (tick effects, round > 20? → draw)
//     → ROUND_START
//

export type BattlePhase =
  | 'round-start'
  | 'player-action'
  | 'enemy-action'
  | 'round-end'
  | 'battle-end'

export type BattleAction =
  | { type: 'attack' }
  | { type: 'defend' }
  | { type: 'skill'; skillId: string }

export interface TurnLogEntry {
  round: number
  actor: 'player' | 'enemy'
  actorName: string
  action: string   // 행동 설명 텍스트
  damage?: number
  heal?: number
  effect?: string  // 버프/디버프 적용 텍스트
}

export type BattleResult = 'victory' | 'defeat' | 'draw'

export interface BattleState {
  round: number
  player: Character
  enemy: Character
  playerDefending: boolean
  enemyDefending: boolean
  isPlayerFirst: boolean
  phase: BattlePhase
  log: TurnLogEntry[]
  result: BattleResult | null
}

// ─── Action Queue ───────────────────────────────────────────
//
// 전투 라운드 결과를 큐에 적재하고, UI가 순차 소비하며 연출한다.
// 로직(동기)과 UI 연출(비동기)의 분리를 위한 패턴.

export interface ActionQueueItem {
  type: 'damage' | 'heal' | 'buff' | 'debuff' | 'defend' | 'effect-expire'
  actor: 'player' | 'enemy'
  actorName: string
  description: string
  value?: number
  targetStat?: BuffTargetStat
  logEntry: TurnLogEntry
  /** 이 액션 실행 직후 시점의 캐릭터 스냅샷 (점진적 HP 바 연출용) */
  playerSnapshot: Character
  enemySnapshot: Character
}
