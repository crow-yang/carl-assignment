import { describe, it, expect, beforeEach } from 'vitest'
import { executeRound } from './round-executor'
import { resetEffectIdCounter } from './effects'
import { DEFAULT_DEFEND_SKILL } from '../constants'
import type { BattleState, Character, AttackSkill, HealSkill } from '../types'

const defaultAttack: AttackSkill = {
  id: 'default-attack', name: '공격', type: 'attack', mpCost: 0, multiplier: 1.0, isDefault: true,
}

function makeCharacter(overrides: Partial<Character> = {}): Character {
  return {
    name: '테스트',
    baseStats: { hp: 100, mp: 50, atk: 15, def: 10, spd: 10 },
    currentHp: 100,
    currentMp: 50,
    skills: [defaultAttack, DEFAULT_DEFEND_SKILL],
    activeEffects: [],
    ...overrides,
  }
}

function makeBattleState(overrides: Partial<BattleState> = {}): BattleState {
  return {
    round: 1,
    player: makeCharacter({ name: '플레이어' }),
    enemy: makeCharacter({ name: '적' }),
    playerDefending: false,
    enemyDefending: false,
    isPlayerFirst: true,
    phase: 'player-action',
    log: [],
    result: null,
    ...overrides,
  }
}

beforeEach(() => {
  resetEffectIdCounter()
})

describe('executeRound — defensive 브랜치', () => {
  it('적에게 기본 공격 스킬이 없으면 fallback → null 반환', () => {
    // 적이 공격/방어 스킬을 아예 갖고 있지 않은 극단적 케이스
    const healOnly: HealSkill = { id: 'heal', name: '회복', type: 'heal', mpCost: 10, healAmount: 20, isDefault: false }
    const state = makeBattleState({
      enemy: makeCharacter({ name: '무장해제', skills: [healOnly], currentMp: 0 }),
    })

    // 플레이어가 공격 → 적은 MP 부족으로 heal 사용 불가, 기본 공격도 없음
    const result = executeRound(state, { type: 'attack' }, 'easy')
    expect(result).toBeNull()
  })

  it('플레이어 스킬에 기본 공격이 없으면 resolveSkill → null', () => {
    const healOnly: HealSkill = { id: 'heal', name: '회복', type: 'heal', mpCost: 10, healAmount: 20, isDefault: false }
    const state = makeBattleState({
      player: makeCharacter({ name: '비무장', skills: [healOnly] }),
    })

    // 플레이어가 { type: 'attack' } 전송하지만 기본 공격 스킬 없음
    const result = executeRound(state, { type: 'attack' }, 'easy')
    expect(result).toBeNull()
  })

  it('스킬 액션에 빈 skillId → null 반환', () => {
    const state = makeBattleState()
    const result = executeRound(state, { type: 'skill', skillId: '' }, 'easy')
    expect(result).toBeNull()
  })

  it('플레이어 스킬에 방어가 없으면 resolveSkill → null', () => {
    const state = makeBattleState({
      player: makeCharacter({ name: '방어불가', skills: [defaultAttack] }),
    })

    // 플레이어가 { type: 'defend' } 전송하지만 방어 스킬 없음
    const result = executeRound(state, { type: 'defend' }, 'easy')
    expect(result).toBeNull()
  })
})
