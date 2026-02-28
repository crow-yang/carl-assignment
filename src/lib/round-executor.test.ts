import { describe, it, expect } from 'vitest'
import { executeRound } from './round-executor'
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
    isPlayerFirst: true,
    phase: 'player-action',
    log: [],
    result: null,
    ...overrides,
  }
}

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

describe('executeRound — rng 주입', () => {
  it('고정 rng → 적 행동이 결정적', () => {
    const state = makeBattleState()
    // rng가 항상 0을 반환하면 적은 항상 같은 선택
    const r1 = executeRound(state, { type: 'attack' }, 'easy', () => 0)
    const r2 = executeRound(state, { type: 'attack' }, 'easy', () => 0)

    expect(r1).not.toBeNull()
    expect(r2).not.toBeNull()
    // 같은 rng → 같은 적 행동
    const enemyLog1 = r1!.actionQueue.find((q) => q.actor === 'enemy')
    const enemyLog2 = r2!.actionQueue.find((q) => q.actor === 'enemy')
    expect(enemyLog1!.description).toBe(enemyLog2!.description)
  })
})

describe('executeRound — 전투 종료', () => {
  it('선공이 적 처치 → battle-end + victory', () => {
    // 플레이어 ATK 극대화, 적 HP 1
    const state = makeBattleState({
      isPlayerFirst: true,
      player: makeCharacter({ name: '용사', baseStats: { hp: 100, mp: 50, atk: 99, def: 10, spd: 15 } }),
      enemy: makeCharacter({ name: '적', currentHp: 1, baseStats: { hp: 100, mp: 50, atk: 10, def: 5, spd: 5 } }),
    })

    const result = executeRound(state, { type: 'attack' }, 'easy', () => 0)
    expect(result).not.toBeNull()
    expect(result!.battleState.phase).toBe('battle-end')
    expect(result!.battleState.result).toBe('victory')
    // 선공 사망이므로 큐에 1개만 (후공 행동 없음)
    expect(result!.actionQueue).toHaveLength(1)
  })

  it('후공이 적 처치 → battle-end + victory', () => {
    // 적이 선공(SPD 높음), 플레이어가 후공에서 적 처치
    const state = makeBattleState({
      isPlayerFirst: false,
      player: makeCharacter({ name: '용사', baseStats: { hp: 100, mp: 50, atk: 99, def: 30, spd: 5 } }),
      enemy: makeCharacter({ name: '적', currentHp: 1, baseStats: { hp: 100, mp: 50, atk: 10, def: 5, spd: 15 } }),
    })

    const result = executeRound(state, { type: 'attack' }, 'easy', () => 0)
    expect(result).not.toBeNull()
    expect(result!.battleState.phase).toBe('battle-end')
    expect(result!.battleState.result).toBe('victory')
    // 선공(적) + 후공(플레이어) = 2개
    expect(result!.actionQueue).toHaveLength(2)
  })

  it('20라운드 초과 → 무승부', () => {
    // 양쪽 DEF가 극도로 높아 데미지 1만 들어감
    const state = makeBattleState({
      round: 20,
      player: makeCharacter({ name: '탱커', baseStats: { hp: 100, mp: 50, atk: 5, def: 99, spd: 10 } }),
      enemy: makeCharacter({ name: '탱커적', baseStats: { hp: 100, mp: 50, atk: 5, def: 99, spd: 10 } }),
    })

    const result = executeRound(state, { type: 'attack' }, 'easy', () => 0)
    expect(result).not.toBeNull()
    expect(result!.battleState.result).toBe('draw')
    expect(result!.battleState.phase).toBe('battle-end')
  })
})

describe('executeRound — effect-expire', () => {
  it('1턴 버프 → 라운드 종료 시 effect-expire 큐 아이템 생성', () => {
    // 플레이어가 remainingTurns: 1인 버프를 갖고 시작
    const state = makeBattleState({
      player: makeCharacter({
        name: '버퍼',
        activeEffects: [
          { id: 'buff-1', type: 'buff', targetStat: 'atk', amount: 5, remainingTurns: 1, sourceName: '기합' },
        ],
      }),
    })

    const result = executeRound(state, { type: 'attack' }, 'easy', () => 0)
    expect(result).not.toBeNull()

    const expireItems = result!.actionQueue.filter((q) => q.type === 'effect-expire')
    expect(expireItems.length).toBeGreaterThanOrEqual(1)
    expect(expireItems[0].actorName).toBe('버퍼')
    expect(expireItems[0].targetStat).toBe('atk')
  })

  it('디버프 만료 → 로그에 "만료됐다" 텍스트', () => {
    const state = makeBattleState({
      enemy: makeCharacter({
        name: '적',
        activeEffects: [
          { id: 'debuff-1', type: 'debuff', targetStat: 'def', amount: 3, remainingTurns: 1, sourceName: '약화' },
        ],
      }),
    })

    const result = executeRound(state, { type: 'attack' }, 'easy', () => 0)
    expect(result).not.toBeNull()

    const expireLogs = result!.battleState.log.filter((l) => l.action.includes('만료됐다'))
    expect(expireLogs.length).toBeGreaterThanOrEqual(1)
    expect(expireLogs[0].action).toContain('약화')
    expect(expireLogs[0].action).toContain('DEF')
  })

  it('remainingTurns > 1인 효과는 만료되지 않음', () => {
    const state = makeBattleState({
      player: makeCharacter({
        name: '버퍼',
        activeEffects: [
          { id: 'buff-1', type: 'buff', targetStat: 'atk', amount: 5, remainingTurns: 3, sourceName: '기합' },
        ],
      }),
    })

    const result = executeRound(state, { type: 'attack' }, 'easy', () => 0)
    expect(result).not.toBeNull()

    const expireItems = result!.actionQueue.filter((q) => q.type === 'effect-expire')
    expect(expireItems).toHaveLength(0)
  })
})

describe('executeRound — 방어 동시 선언', () => {
  it('후공이 방어 → 같은 라운드 선공 공격에 방어 적용 (데미지 감소)', () => {
    // 플레이어(선공) 공격, 적(후공) 방어만 가능
    const state = makeBattleState({
      isPlayerFirst: true,
      player: makeCharacter({ name: '플레이어', baseStats: { hp: 100, mp: 50, atk: 20, def: 10, spd: 15 } }),
      enemy: makeCharacter({
        name: '적',
        skills: [DEFAULT_DEFEND_SKILL],
        baseStats: { hp: 100, mp: 50, atk: 10, def: 10, spd: 5 },
      }),
    })

    const result = executeRound(state, { type: 'attack' }, 'easy', () => 0)
    expect(result).not.toBeNull()

    // 방어 동시 선언이므로 데미지가 50% 감소됨
    // damage = floor((20*1.0 - 10*0.5) * 0.5) = floor(15 * 0.5) = 7
    const damageItem = result!.actionQueue.find((q) => q.type === 'damage')
    expect(damageItem!.value).toBe(7)
  })

  it('방어 없이 공격 → 방어 미적용 데미지', () => {
    // 동일 스탯에서 방어 없이 공격
    const state = makeBattleState({
      isPlayerFirst: true,
      player: makeCharacter({ name: '플레이어', baseStats: { hp: 100, mp: 50, atk: 20, def: 10, spd: 15 } }),
      enemy: makeCharacter({
        name: '적',
        skills: [defaultAttack, DEFAULT_DEFEND_SKILL],
        baseStats: { hp: 100, mp: 50, atk: 10, def: 10, spd: 5 },
      }),
    })

    // rng=0 → 적이 방어 안 함 (easy: 0 < 0.1 → defend... actually 0 < 0.1 is true → defend)
    // rng=0.5 → 적이 기본공격 (0.5 >= 0.3 → basicAttack)
    const result = executeRound(state, { type: 'attack' }, 'easy', () => 0.5)
    expect(result).not.toBeNull()

    // 방어 없이: damage = floor((20*1.0 - 10*0.5) * 1.0) = floor(15) = 15
    const damageItem = result!.actionQueue.find((q) => q.type === 'damage' && q.actor === 'player')
    expect(damageItem!.value).toBe(15)
  })

  it('방어 상태는 라운드 내에서만 유효 (BattleState에 이월되지 않음)', () => {
    const state = makeBattleState({
      isPlayerFirst: true,
      player: makeCharacter({ name: '플레이어', baseStats: { hp: 100, mp: 50, atk: 15, def: 10, spd: 15 } }),
      enemy: makeCharacter({
        name: '적',
        skills: [DEFAULT_DEFEND_SKILL],
        baseStats: { hp: 100, mp: 50, atk: 10, def: 10, spd: 5 },
      }),
    })

    const result = executeRound(state, { type: 'defend' }, 'easy', () => 0)
    expect(result).not.toBeNull()

    // BattleState에 defending 필드가 없으므로 다음 라운드에 이월되지 않음을 확인
    // (방어 상태는 라운드 실행 중 로컬 변수로만 관리됨)
    expect(result!.battleState).not.toHaveProperty('playerDefending')
    expect(result!.battleState).not.toHaveProperty('enemyDefending')
  })
})
