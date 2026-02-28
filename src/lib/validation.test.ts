import { describe, it, expect } from 'vitest'
import {
  validateName,
  validateStats,
  validateCustomSkill,
  getRemainingPoints,
  isStatInRange,
} from './validation'
import type { Stats } from '../types'

describe('validateName', () => {
  it('1~10자 이름은 유효', () => {
    expect(validateName('용사').valid).toBe(true)
    expect(validateName('A').valid).toBe(true)
    expect(validateName('1234567890').valid).toBe(true)
  })

  it('빈 이름은 무효', () => {
    const result = validateName('')
    expect(result.valid).toBe(false)
    expect(result.errors.length).toBeGreaterThan(0)
  })

  it('11자 이상은 무효', () => {
    const result = validateName('12345678901')
    expect(result.valid).toBe(false)
  })
})

describe('validateStats', () => {
  const validStats: Stats = { hp: 100, mp: 50, atk: 20, def: 15, spd: 15 }

  it('총합 200이고 범위 내면 유효', () => {
    expect(validateStats(validStats).valid).toBe(true)
  })

  it('총합이 200이 아니면 무효', () => {
    const result = validateStats({ hp: 100, mp: 50, atk: 20, def: 15, spd: 10 })
    expect(result.valid).toBe(false)
  })

  it('스탯이 최소값 미만이면 무효', () => {
    const result = validateStats({ hp: 10, mp: 50, atk: 20, def: 15, spd: 15 })
    expect(result.valid).toBe(false)
  })

  it('스탯이 최대값 초과면 무효', () => {
    const result = validateStats({ hp: 150, mp: 20, atk: 5, def: 5, spd: 20 })
    expect(result.valid).toBe(false)
  })

  it('모든 스탯이 최소값이면 총합 55 → 무효', () => {
    const result = validateStats({ hp: 20, mp: 20, atk: 5, def: 5, spd: 5 })
    expect(result.valid).toBe(false)
  })
})

describe('validateCustomSkill', () => {
  it('attack 타입 유효', () => {
    const result = validateCustomSkill({
      type: 'attack', name: '파이어볼', mpCost: 15, multiplier: 2.0,
    })
    expect(result.valid).toBe(true)
  })

  it('heal 타입 유효', () => {
    const result = validateCustomSkill({
      type: 'heal', name: '힐링', mpCost: 10, healAmount: 30,
    })
    expect(result.valid).toBe(true)
  })

  it('buff 타입 유효', () => {
    const result = validateCustomSkill({
      type: 'buff', name: '분노', mpCost: 8, targetStat: 'atk', amount: 5, duration: 3,
    })
    expect(result.valid).toBe(true)
  })

  it('debuff 타입 유효', () => {
    const result = validateCustomSkill({
      type: 'debuff', name: '위협', mpCost: 10, targetStat: 'def', amount: 5, duration: 3,
    })
    expect(result.valid).toBe(true)
  })

  it('이름 빈값은 무효', () => {
    const result = validateCustomSkill({
      type: 'attack', name: '', mpCost: 10, multiplier: 1.5,
    })
    expect(result.valid).toBe(false)
  })

  it('이름 9자 이상은 무효', () => {
    const result = validateCustomSkill({
      type: 'attack', name: '123456789', mpCost: 10, multiplier: 1.5,
    })
    expect(result.valid).toBe(false)
  })

  it('MP 소모 범위 초과는 무효', () => {
    const result = validateCustomSkill({
      type: 'attack', name: '강타', mpCost: 31, multiplier: 1.5,
    })
    expect(result.valid).toBe(false)
  })

  it('배율 범위 초과는 무효', () => {
    const result = validateCustomSkill({
      type: 'attack', name: '강타', mpCost: 10, multiplier: 3.1,
    })
    expect(result.valid).toBe(false)
  })

  it('회복량 범위 미달은 무효', () => {
    const result = validateCustomSkill({
      type: 'heal', name: '힐', mpCost: 5, healAmount: 5,
    })
    expect(result.valid).toBe(false)
  })

  it('지속 턴 범위 초과는 무효', () => {
    const result = validateCustomSkill({
      type: 'buff', name: '버프', mpCost: 5, targetStat: 'atk', amount: 3, duration: 6,
    })
    expect(result.valid).toBe(false)
  })
})

describe('getRemainingPoints', () => {
  it('총합 200이면 잔여 0', () => {
    expect(getRemainingPoints({ hp: 100, mp: 50, atk: 20, def: 15, spd: 15 })).toBe(0)
  })

  it('최소값이면 잔여 145', () => {
    expect(getRemainingPoints({ hp: 20, mp: 20, atk: 5, def: 5, spd: 5 })).toBe(145)
  })
})

describe('isStatInRange', () => {
  it('HP 20~100 범위 확인', () => {
    expect(isStatInRange('hp', 20)).toBe(true)
    expect(isStatInRange('hp', 100)).toBe(true)
    expect(isStatInRange('hp', 19)).toBe(false)
    expect(isStatInRange('hp', 101)).toBe(false)
  })

  it('ATK 5~30 범위 확인', () => {
    expect(isStatInRange('atk', 5)).toBe(true)
    expect(isStatInRange('atk', 30)).toBe(true)
    expect(isStatInRange('atk', 4)).toBe(false)
    expect(isStatInRange('atk', 31)).toBe(false)
  })
})
