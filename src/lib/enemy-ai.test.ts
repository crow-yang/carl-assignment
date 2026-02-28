import { describe, it, expect } from 'vitest'
import { decideEnemyAction } from './enemy-ai'
import { ENEMY_SKILLS, ENEMY_STATS } from '../constants'
import type { Character, BattleAction } from '../types'

function makeEnemy(difficulty: 'easy' | 'normal' | 'hard', overrides: Partial<Character> = {}): Character {
  const stats = ENEMY_STATS[difficulty]
  return {
    name: '적',
    baseStats: stats,
    currentHp: stats.hp,
    currentMp: stats.mp,
    skills: ENEMY_SKILLS[difficulty],
    activeEffects: [],
    ...overrides,
  }
}

function makePlayer(overrides: Partial<Character> = {}): Character {
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

/** 타입 좁힘 후 skillId 추출 */
function expectSkillId(action: BattleAction, expectedId: string) {
  expect(action.type).toBe('skill')
  if (action.type === 'skill') {
    expect(action.skillId).toBe(expectedId)
  }
}

describe('decideEnemyAction - easy', () => {
  it('rng 0.05 → 방어', () => {
    const action = decideEnemyAction(makeEnemy('easy'), makePlayer(), 'easy', () => 0.05)
    expect(action.type).toBe('defend')
  })

  it('rng 0.2 → 강타 (MP 충분)', () => {
    const action = decideEnemyAction(makeEnemy('easy'), makePlayer(), 'easy', () => 0.2)
    expectSkillId(action, 'enemy-smash-easy')
  })

  it('rng 0.5 → 기본 공격', () => {
    const action = decideEnemyAction(makeEnemy('easy'), makePlayer(), 'easy', () => 0.5)
    expect(action.type).toBe('attack')
  })

  it('MP 부족 시 강타 대신 기본 공격 (fallback)', () => {
    const enemy = makeEnemy('easy', { currentMp: 0 })
    const action = decideEnemyAction(enemy, makePlayer(), 'easy', () => 0.2)
    expect(action.type).toBe('attack')
  })
})

describe('decideEnemyAction - normal', () => {
  it('HP > 50%일 때 rng 0.2 → 강타', () => {
    const action = decideEnemyAction(makeEnemy('normal'), makePlayer(), 'normal', () => 0.2)
    expectSkillId(action, 'enemy-smash-normal')
  })

  it('HP <= 50%일 때 rng 0.3 → 회복', () => {
    const enemy = makeEnemy('normal', { currentHp: 40 }) // 40/110 = 36%
    const action = decideEnemyAction(enemy, makePlayer(), 'normal', () => 0.3)
    expectSkillId(action, 'enemy-heal-normal')
  })

  it('HP <= 50%일 때 rng 0.5 → 방어', () => {
    const enemy = makeEnemy('normal', { currentHp: 40 })
    const action = decideEnemyAction(enemy, makePlayer(), 'normal', () => 0.5)
    expect(action.type).toBe('defend')
  })

  it('HP <= 50%일 때 rng 0.7 → 강타', () => {
    const enemy = makeEnemy('normal', { currentHp: 40 })
    const action = decideEnemyAction(enemy, makePlayer(), 'normal', () => 0.7)
    expectSkillId(action, 'enemy-smash-normal')
  })

  it('HP <= 50%일 때 rng 0.9 → 기본 공격', () => {
    const enemy = makeEnemy('normal', { currentHp: 40 })
    const action = decideEnemyAction(enemy, makePlayer(), 'normal', () => 0.9)
    expect(action.type).toBe('attack')
  })

  it('HP > 50%이고 hpRatio <= 0.7 → 회복', () => {
    // 71/110 ≈ 0.645 → HP > 50% && hpRatio <= 0.7
    const enemy = makeEnemy('normal', { currentHp: 71 })
    const action = decideEnemyAction(enemy, makePlayer(), 'normal', () => 0.35)
    expectSkillId(action, 'enemy-heal-normal')
  })

  it('HP > 50%일 때 rng 0.5 → 기본 공격', () => {
    const action = decideEnemyAction(makeEnemy('normal'), makePlayer(), 'normal', () => 0.5)
    expect(action.type).toBe('attack')
  })

  it('HP > 50%일 때 rng 0.95 → 방어', () => {
    const action = decideEnemyAction(makeEnemy('normal'), makePlayer(), 'normal', () => 0.95)
    expect(action.type).toBe('defend')
  })
})

describe('decideEnemyAction - hard', () => {
  it('HP <= 30%이고 회복 가능 → 회복', () => {
    const enemy = makeEnemy('hard', { currentHp: 30 }) // 30/140 = 21%
    const action = decideEnemyAction(enemy, makePlayer(), 'hard', () => 0.5)
    expectSkillId(action, 'enemy-heal-hard')
  })

  it('HP <= 30%이고 MP 부족 → 방어 (fallback)', () => {
    const enemy = makeEnemy('hard', { currentHp: 30, currentMp: 0 })
    const action = decideEnemyAction(enemy, makePlayer(), 'hard', () => 0.5)
    expect(action.type).toBe('defend')
  })

  it('상대에게 DEF 디버프 없으면 → 약화 시전', () => {
    const enemy = makeEnemy('hard')
    const player = makePlayer()
    const action = decideEnemyAction(enemy, player, 'hard', () => 0.5)
    expectSkillId(action, 'enemy-weaken-hard')
  })

  it('상대에게 DEF 디버프 이미 있으면 → 약화 스킵', () => {
    const enemy = makeEnemy('hard')
    const player = makePlayer({
      activeEffects: [{ id: '1', type: 'debuff', targetStat: 'def', amount: 5, remainingTurns: 2, sourceName: '약화' }],
    })
    const action = decideEnemyAction(enemy, player, 'hard', () => 0.3)
    if (action.type === 'skill') {
      expect(action.skillId).not.toBe('enemy-weaken-hard')
    }
  })

  it('상대 HP <= 30%이면 → 강타 마무리', () => {
    const enemy = makeEnemy('hard')
    const player = makePlayer({
      currentHp: 20,
      activeEffects: [{ id: '1', type: 'debuff', targetStat: 'def', amount: 5, remainingTurns: 2, sourceName: '약화' }],
    })
    const action = decideEnemyAction(enemy, player, 'hard', () => 0.5)
    expectSkillId(action, 'enemy-smash-hard')
  })

  it('일반 상황에서 hpRatio <= 0.6 → 회복', () => {
    // HP 80/140 ≈ 0.57, 디버프 있음 + 상대 HP > 30%
    const enemy = makeEnemy('hard', { currentHp: 80 })
    const player = makePlayer({
      activeEffects: [{ id: '1', type: 'debuff', targetStat: 'def', amount: 5, remainingTurns: 2, sourceName: '약화' }],
    })
    const action = decideEnemyAction(enemy, player, 'hard', () => 0.6)
    expectSkillId(action, 'enemy-heal-hard')
  })

  it('일반 상황에서 기본 공격 fallback', () => {
    // 디버프 있음 + 상대 HP > 30% + rng 0.8 → 강타/회복 조건 불충족 → 기본공격
    const enemy = makeEnemy('hard')
    const player = makePlayer({
      activeEffects: [{ id: '1', type: 'debuff', targetStat: 'def', amount: 5, remainingTurns: 2, sourceName: '약화' }],
    })
    const action = decideEnemyAction(enemy, player, 'hard', () => 0.8)
    expect(action.type).toBe('attack')
  })
})
