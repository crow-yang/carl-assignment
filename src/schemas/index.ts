import { z } from 'zod/v4'
import { STAT_RANGES, TOTAL_STAT_POINTS } from '../constants'

// ─── 이름 스키마 ────────────────────────────────────────────
export const nameSchema = z.string().min(1, '이름을 입력해주세요').max(10, '10자 이하로 입력해주세요')

// ─── 스탯 스키마 ────────────────────────────────────────────
const baseStatsSchema = z.object({
  hp:  z.number().min(STAT_RANGES.hp.min).max(STAT_RANGES.hp.max),
  mp:  z.number().min(STAT_RANGES.mp.min).max(STAT_RANGES.mp.max),
  atk: z.number().min(STAT_RANGES.atk.min).max(STAT_RANGES.atk.max),
  def: z.number().min(STAT_RANGES.def.min).max(STAT_RANGES.def.max),
  spd: z.number().min(STAT_RANGES.spd.min).max(STAT_RANGES.spd.max),
})

export const statsSchema = z.pipe(
  baseStatsSchema,
  z.custom<z.infer<typeof baseStatsSchema>>((data) => {
    const d = data as z.infer<typeof baseStatsSchema>
    const total = d.hp + d.mp + d.atk + d.def + d.spd
    return total === TOTAL_STAT_POINTS
  }, `총 포인트가 ${TOTAL_STAT_POINTS}이어야 합니다`),
)

// ─── 커스텀 스킬 스키마 ────────────────────────────────────
const skillNameSchema = z.string().min(1, '스킬 이름을 입력해주세요').max(8, '8자 이하로 입력해주세요')
const mpCostSchema = z.number().min(1, 'MP 소모는 1 이상').max(30, 'MP 소모는 30 이하')

export const attackSkillSchema = z.object({
  type: z.literal('attack'),
  name: skillNameSchema,
  mpCost: mpCostSchema,
  multiplier: z.number().min(1.0, '배율은 1.0 이상').max(3.0, '배율은 3.0 이하'),
})

export const healSkillSchema = z.object({
  type: z.literal('heal'),
  name: skillNameSchema,
  mpCost: mpCostSchema,
  healAmount: z.number().min(10, '회복량은 10 이상').max(50, '회복량은 50 이하'),
})

export const statusEffectSkillSchema = z.object({
  type: z.enum(['buff', 'debuff']),
  name: skillNameSchema,
  mpCost: mpCostSchema,
  targetStat: z.enum(['atk', 'def']),
  amount: z.number().min(1, '수치는 1 이상').max(10, '수치는 10 이하'),
  duration: z.number().min(1, '지속 턴은 1 이상').max(5, '지속 턴은 5 이하'),
})

export const customSkillSchema = z.union([
  attackSkillSchema,
  healSkillSchema,
  statusEffectSkillSchema,
])

export type CustomSkillFormData = z.infer<typeof customSkillSchema>
