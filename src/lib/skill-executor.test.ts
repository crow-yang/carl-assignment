import { describe, it, expect, beforeEach } from 'vitest'
import { executeSkill } from './skill-executor'
import { resetEffectIdCounter } from './effects'
import type { Character, AttackSkill, DefendSkill, HealSkill, StatusEffectSkill } from '../types'

function makeCharacter(overrides: Partial<Character> = {}): Character {
  return {
    name: '플레이어',
    baseStats: { hp: 100, mp: 50, atk: 20, def: 10, spd: 10 },
    currentHp: 100,
    currentMp: 50,
    skills: [],
    activeEffects: [],
    ...overrides,
  }
}

beforeEach(() => {
  resetEffectIdCounter()
})

describe('executeSkill - attack', () => {
  const skill: AttackSkill = {
    id: 'atk', name: '공격', type: 'attack', mpCost: 0, multiplier: 1.0, isDefault: true,
  }

  it('기본 공격 데미지 계산', () => {
    const actor = makeCharacter({ name: '용사' })
    const target = makeCharacter({ name: '슬라임', baseStats: { hp: 80, mp: 30, atk: 10, def: 8, spd: 7 } })
    const result = executeSkill(actor, target, skill, 1, 'player', false)

    // (20 * 1.0 - 8 * 0.5) * 1.0 = 16
    expect(result.targetHpChange).toBe(-16)
    expect(result.actorMpChange).toBe(0)
    expect(result.isDefending).toBe(false)
    expect(result.logEntry.damage).toBe(16)
  })

  it('상대 방어 시 데미지 반감', () => {
    const actor = makeCharacter()
    const target = makeCharacter({ baseStats: { hp: 80, mp: 30, atk: 10, def: 10, spd: 7 } })
    const result = executeSkill(actor, target, skill, 1, 'player', true)

    // (20 * 1.0 - 10 * 0.5) * 0.5 = 7.5 → 7
    expect(result.targetHpChange).toBe(-7)
  })

  it('스킬 배율 적용', () => {
    const strongSkill: AttackSkill = {
      id: 's', name: '강타', type: 'attack', mpCost: 10, multiplier: 1.5, isDefault: false,
    }
    const actor = makeCharacter()
    const target = makeCharacter({ baseStats: { hp: 80, mp: 30, atk: 10, def: 10, spd: 7 } })
    const result = executeSkill(actor, target, strongSkill, 1, 'player', false)

    // (20 * 1.5 - 10 * 0.5) * 1.0 = 25
    expect(result.targetHpChange).toBe(-25)
    expect(result.actorMpChange).toBe(-10)
  })
})

describe('executeSkill - defend', () => {
  const skill: DefendSkill = { id: 'def', name: '방어', type: 'defend', mpCost: 0, isDefault: true }

  it('방어 플래그 설정', () => {
    const actor = makeCharacter()
    const target = makeCharacter()
    const result = executeSkill(actor, target, skill, 1, 'player', false)

    expect(result.isDefending).toBe(true)
    expect(result.targetHpChange).toBe(0)
    expect(result.actorMpChange).toBe(0)
  })
})

describe('executeSkill - heal', () => {
  const skill: HealSkill = {
    id: 'heal', name: '회복', type: 'heal', mpCost: 10, healAmount: 30, isDefault: false,
  }

  it('HP 회복', () => {
    const actor = makeCharacter({ currentHp: 50 })
    const target = makeCharacter()
    const result = executeSkill(actor, target, skill, 1, 'player', false)

    expect(result.logEntry.heal).toBe(30)
    expect(result.actorMpChange).toBe(-10)
  })

  it('최대 HP 초과 불가', () => {
    const actor = makeCharacter({ currentHp: 90, baseStats: { hp: 100, mp: 50, atk: 20, def: 10, spd: 10 } })
    const target = makeCharacter()
    const result = executeSkill(actor, target, skill, 1, 'player', false)

    // 100 - 90 = 10만큼만 회복
    expect(result.logEntry.heal).toBe(10)
  })

  it('HP가 최대일 때 회복량 0', () => {
    const actor = makeCharacter({ currentHp: 100 })
    const target = makeCharacter()
    const result = executeSkill(actor, target, skill, 1, 'player', false)

    expect(result.logEntry.heal).toBe(0)
  })
})

describe('executeSkill - buff', () => {
  const skill: StatusEffectSkill = {
    id: 'b', name: '분노', type: 'buff', mpCost: 8, targetStat: 'atk', amount: 5, duration: 3, isDefault: false,
  }

  it('자신에게 버프 효과 추가', () => {
    const actor = makeCharacter()
    const target = makeCharacter()
    const result = executeSkill(actor, target, skill, 1, 'player', false)

    expect(result.newActorEffects).toHaveLength(1)
    expect(result.newActorEffects[0].type).toBe('buff')
    expect(result.newActorEffects[0].targetStat).toBe('atk')
    expect(result.newActorEffects[0].amount).toBe(5)
    expect(result.newActorEffects[0].remainingTurns).toBe(3)
    expect(result.actorMpChange).toBe(-8)
    expect(result.newTargetEffects).toHaveLength(0) // 상대에 영향 없음
  })
})

describe('executeSkill - debuff', () => {
  const skill: StatusEffectSkill = {
    id: 'd', name: '약화', type: 'debuff', mpCost: 10, targetStat: 'def', amount: 5, duration: 3, isDefault: false,
  }

  it('상대에게 디버프 효과 추가', () => {
    const actor = makeCharacter()
    const target = makeCharacter()
    const result = executeSkill(actor, target, skill, 1, 'enemy', false)

    expect(result.newTargetEffects).toHaveLength(1)
    expect(result.newTargetEffects[0].type).toBe('debuff')
    expect(result.newTargetEffects[0].targetStat).toBe('def')
    expect(result.newActorEffects).toHaveLength(0) // 자신에 영향 없음
    expect(result.actorMpChange).toBe(-10)
  })
})
