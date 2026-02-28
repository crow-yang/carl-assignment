import type {
  StatType,
  StatRange,
  Stats,
  SkillType,
  Difficulty,
  Skill,
  AttackSkill,
  DefendSkill,
} from '../types'

// ─── 스탯 키 순서 ────────────────────────────────────────────
export const STAT_KEYS: StatType[] = ['hp', 'mp', 'atk', 'def', 'spd']

// ─── 스탯 설정 ─────────────────────────────────────────────
export const TOTAL_STAT_POINTS = 200

export const STAT_RANGES: Record<StatType, StatRange> = {
  hp:  { min: 20, max: 100 },
  mp:  { min: 20, max: 100 },
  atk: { min: 5,  max: 30 },
  def: { min: 5,  max: 30 },
  spd: { min: 5,  max: 30 },
}

export const STAT_LABELS: Record<StatType, string> = {
  hp:  'HP',
  mp:  'MP',
  atk: 'ATK',
  def: 'DEF',
  spd: 'SPD',
}

export const DEFAULT_STATS: Stats = {
  hp:  20,
  mp:  20,
  atk: 5,
  def: 5,
  spd: 5,
}

// ─── 기본 스킬 ─────────────────────────────────────────────
export const DEFAULT_ATTACK_SKILL: AttackSkill = {
  id: 'default-attack',
  name: '공격',
  type: 'attack',
  mpCost: 0,
  multiplier: 1.0,
  isDefault: true,
}

export const DEFAULT_DEFEND_SKILL: DefendSkill = {
  id: 'default-defend',
  name: '방어',
  type: 'defend',
  mpCost: 0,
  isDefault: true,
}

export const DEFAULT_SKILLS: Skill[] = [
  DEFAULT_ATTACK_SKILL,
  DEFAULT_DEFEND_SKILL,
]

export const MAX_CUSTOM_SKILLS = 2

// ─── 전투 설정 ─────────────────────────────────────────────
export const MAX_ROUNDS = 20
export const DEFEND_DAMAGE_REDUCTION = 0.5
export const DEF_MULTIPLIER = 0.5
export const MIN_DAMAGE = 1

// ─── 난이도별 적 데이터 ────────────────────────────────────
export const ENEMY_STATS: Record<Difficulty, Stats> = {
  easy:   { hp: 80,  mp: 30, atk: 10, def: 8,  spd: 7 },
  normal: { hp: 110, mp: 50, atk: 15, def: 12, spd: 10 },
  hard:   { hp: 140, mp: 70, atk: 20, def: 16, spd: 14 },
}

export const ENEMY_NAMES: Record<Difficulty, string> = {
  easy:   '슬라임',
  normal: '오크 전사',
  hard:   '드래곤 나이트',
}

export const ENEMY_SKILLS: Record<Difficulty, Skill[]> = {
  easy: [
    DEFAULT_ATTACK_SKILL,
    DEFAULT_DEFEND_SKILL,
    { id: 'enemy-smash-easy', name: '강타', type: 'attack', mpCost: 8, multiplier: 1.3, isDefault: false },
  ],
  normal: [
    DEFAULT_ATTACK_SKILL,
    DEFAULT_DEFEND_SKILL,
    { id: 'enemy-smash-normal', name: '강타', type: 'attack', mpCost: 10, multiplier: 1.5, isDefault: false },
    { id: 'enemy-heal-normal', name: '회복', type: 'heal', mpCost: 10, healAmount: 20, isDefault: false },
  ],
  hard: [
    DEFAULT_ATTACK_SKILL,
    DEFAULT_DEFEND_SKILL,
    { id: 'enemy-smash-hard', name: '강타', type: 'attack', mpCost: 12, multiplier: 1.7, isDefault: false },
    { id: 'enemy-heal-hard', name: '회복', type: 'heal', mpCost: 12, healAmount: 30, isDefault: false },
    { id: 'enemy-weaken-hard', name: '약화', type: 'debuff', mpCost: 10, targetStat: 'def', amount: 5, duration: 3, isDefault: false },
  ],
}

// ─── 난이도 레이블 ─────────────────────────────────────────
export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  easy:   '쉬움',
  normal: '보통',
  hard:   '어려움',
}

export const DIFFICULTY_DESCRIPTIONS: Record<Difficulty, string> = {
  easy:   '약한 적',
  normal: '보통 적',
  hard:   '강한 적',
}

// ─── 스킬 타입 레이블 ───────────────────────────────────────
export const SKILL_TYPE_LABELS: Record<SkillType, string> = {
  attack: '공격',
  defend: '방어',
  heal:   '회복',
  buff:   '버프',
  debuff: '디버프',
}

// ─── 유틸 ───────────────────────────────────────────────────
export function sumStats(stats: Stats): number {
  return stats.hp + stats.mp + stats.atk + stats.def + stats.spd
}
