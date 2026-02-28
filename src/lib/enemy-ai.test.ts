import { describe, it, expect } from 'vitest'
import { decideEnemyAction } from './enemy-ai'
import { ENEMY_SKILLS, ENEMY_STATS } from '../constants'
import type { Character } from '../types'

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

describe('decideEnemyAction - easy', () => {
  it('rng 0.05 → 방어', () => {
    const action = decideEnemyAction(makeEnemy('easy'), makePlayer(), 'easy', () => 0.05)
    expect(action.type).toBe('defend')
  })

  it('rng 0.2 → 강타 (MP 충분)', () => {
    const action = decideEnemyAction(makeEnemy('easy'), makePlayer(), 'easy', () => 0.2)
    expect(action.type).toBe('skill')
    expect(action.skillId).toBe('enemy-smash-easy')
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
    expect(action.type).toBe('skill')
    expect(action.skillId).toBe('enemy-smash-normal')
  })

  it('HP <= 50%일 때 rng 0.3 → 회복', () => {
    const enemy = makeEnemy('normal', { currentHp: 40 }) // 40/110 = 36%
    const action = decideEnemyAction(enemy, makePlayer(), 'normal', () => 0.3)
    expect(action.type).toBe('skill')
    expect(action.skillId).toBe('enemy-heal-normal')
  })

  it('HP <= 50%일 때 rng 0.5 → 방어', () => {
    const enemy = makeEnemy('normal', { currentHp: 40 })
    const action = decideEnemyAction(enemy, makePlayer(), 'normal', () => 0.5)
    expect(action.type).toBe('defend')
  })
})

describe('decideEnemyAction - hard', () => {
  it('HP <= 30%이고 회복 가능 → 회복', () => {
    const enemy = makeEnemy('hard', { currentHp: 30 }) // 30/140 = 21%
    const action = decideEnemyAction(enemy, makePlayer(), 'hard', () => 0.5)
    expect(action.type).toBe('skill')
    expect(action.skillId).toBe('enemy-heal-hard')
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
    expect(action.type).toBe('skill')
    expect(action.skillId).toBe('enemy-weaken-hard')
  })

  it('상대에게 DEF 디버프 이미 있으면 → 약화 스킵', () => {
    const enemy = makeEnemy('hard')
    const player = makePlayer({
      activeEffects: [{ id: '1', type: 'debuff', targetStat: 'def', amount: 5, remainingTurns: 2, sourceName: '약화' }],
    })
    const action = decideEnemyAction(enemy, player, 'hard', () => 0.3)
    expect(action.skillId).not.toBe('enemy-weaken-hard')
  })

  it('상대 HP <= 30%이면 → 강타 마무리', () => {
    const enemy = makeEnemy('hard')
    const player = makePlayer({
      currentHp: 20,
      activeEffects: [{ id: '1', type: 'debuff', targetStat: 'def', amount: 5, remainingTurns: 2, sourceName: '약화' }],
    })
    const action = decideEnemyAction(enemy, player, 'hard', () => 0.5)
    expect(action.type).toBe('skill')
    expect(action.skillId).toBe('enemy-smash-hard')
  })
})
