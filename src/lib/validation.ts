import type { Stats } from '../types'
import { STAT_RANGES, TOTAL_STAT_POINTS } from '../constants'
import { nameSchema, statsSchema, customSkillSchema, type CustomSkillFormData } from '../schemas'

export interface ValidationResult {
  valid: boolean
  errors: string[]
}

/** 캐릭터 이름 검증 */
export function validateName(name: string): ValidationResult {
  const result = nameSchema.safeParse(name)
  if (result.success) return { valid: true, errors: [] }
  return { valid: false, errors: result.error.issues.map((i) => i.message) }
}

/** 스탯 배분 검증 (각 스탯 범위 + 총합 200) */
export function validateStats(stats: Stats): ValidationResult {
  const result = statsSchema.safeParse(stats)
  if (result.success) return { valid: true, errors: [] }
  return { valid: false, errors: result.error.issues.map((i) => i.message) }
}

/** 커스텀 스킬 입력 검증 */
export function validateCustomSkill(data: CustomSkillFormData): ValidationResult {
  const result = customSkillSchema.safeParse(data)
  if (result.success) return { valid: true, errors: [] }
  return { valid: false, errors: result.error.issues.map((i) => i.message) }
}

/** 잔여 포인트 계산 */
export function getRemainingPoints(stats: Stats): number {
  const used = stats.hp + stats.mp + stats.atk + stats.def + stats.spd
  return TOTAL_STAT_POINTS - used
}

/** 개별 스탯이 범위 내인지 확인 */
export function isStatInRange(stat: keyof Stats, value: number): boolean {
  const range = STAT_RANGES[stat]
  return value >= range.min && value <= range.max
}
