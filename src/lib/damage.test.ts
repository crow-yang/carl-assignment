import { describe, it, expect } from 'vitest'
import { calculateDamage } from './damage'

describe('calculateDamage', () => {
  it('일반 공격 (배율 1.0, 방어 안함)', () => {
    // (20 * 1.0 - 10 * 0.5) * 1.0 = 15
    expect(calculateDamage(20, 1.0, 10, false)).toBe(15)
  })

  it('스킬 배율 적용', () => {
    // (20 * 2.0 - 10 * 0.5) * 1.0 = 35
    expect(calculateDamage(20, 2.0, 10, false)).toBe(35)
  })

  it('방어 시 데미지 50% 감소', () => {
    // (20 * 1.0 - 10 * 0.5) * 0.5 = 7.5 → 7 (floor)
    expect(calculateDamage(20, 1.0, 10, true)).toBe(7)
  })

  it('DEF가 높아서 음수가 되면 최소 데미지 1 보장', () => {
    // (5 * 1.0 - 30 * 0.5) * 1.0 = -10 → 1
    expect(calculateDamage(5, 1.0, 30, false)).toBe(1)
  })

  it('방어 + DEF 높을 때도 최소 데미지 1', () => {
    // (5 * 1.0 - 30 * 0.5) * 0.5 = -5 → 1
    expect(calculateDamage(5, 1.0, 30, true)).toBe(1)
  })

  it('높은 배율 스킬', () => {
    // (30 * 3.0 - 5 * 0.5) * 1.0 = 87.5 → 87
    expect(calculateDamage(30, 3.0, 5, false)).toBe(87)
  })

  it('ATK과 DEF가 같을 때', () => {
    // (15 * 1.0 - 15 * 0.5) * 1.0 = 7.5 → 7
    expect(calculateDamage(15, 1.0, 15, false)).toBe(7)
  })

  it('DEF가 ATK보다 약간 높을 때 배율로 보완', () => {
    // (10 * 1.5 - 12 * 0.5) * 1.0 = 9
    expect(calculateDamage(10, 1.5, 12, false)).toBe(9)
  })
})
