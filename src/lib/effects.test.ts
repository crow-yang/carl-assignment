import { describe, it, expect, beforeEach } from 'vitest'
import {
  getEffectiveStat,
  tickEffects,
  addEffect,
  resetEffectIdCounter,
} from './effects'
import type { ActiveEffect } from '../types'

beforeEach(() => {
  resetEffectIdCounter()
})

describe('getEffectiveStat', () => {
  it('효과 없으면 기본 스탯 반환', () => {
    expect(getEffectiveStat(20, 'atk', [])).toBe(20)
  })

  it('버프 적용 시 스탯 증가', () => {
    const effects: ActiveEffect[] = [
      { id: '1', type: 'buff', targetStat: 'atk', amount: 5, remainingTurns: 3, sourceName: '분노' },
    ]
    expect(getEffectiveStat(20, 'atk', effects)).toBe(25)
  })

  it('디버프 적용 시 스탯 감소', () => {
    const effects: ActiveEffect[] = [
      { id: '1', type: 'debuff', targetStat: 'def', amount: 5, remainingTurns: 2, sourceName: '약화' },
    ]
    expect(getEffectiveStat(12, 'def', effects)).toBe(7)
  })

  it('버프 + 디버프 중첩', () => {
    const effects: ActiveEffect[] = [
      { id: '1', type: 'buff', targetStat: 'atk', amount: 5, remainingTurns: 3, sourceName: '분노' },
      { id: '2', type: 'debuff', targetStat: 'atk', amount: 3, remainingTurns: 2, sourceName: '위협' },
    ]
    // 20 + 5 - 3 = 22
    expect(getEffectiveStat(20, 'atk', effects)).toBe(22)
  })

  it('다른 스탯 효과는 무시', () => {
    const effects: ActiveEffect[] = [
      { id: '1', type: 'buff', targetStat: 'def', amount: 10, remainingTurns: 3, sourceName: '방벽' },
    ]
    // atk에는 영향 없음
    expect(getEffectiveStat(20, 'atk', effects)).toBe(20)
  })

  it('디버프가 기본 스탯보다 크면 최소 0', () => {
    const effects: ActiveEffect[] = [
      { id: '1', type: 'debuff', targetStat: 'atk', amount: 10, remainingTurns: 3, sourceName: '약화' },
      { id: '2', type: 'debuff', targetStat: 'atk', amount: 10, remainingTurns: 2, sourceName: '저주' },
    ]
    expect(getEffectiveStat(5, 'atk', effects)).toBe(0)
  })

  it('같은 타입 버프 여러 개 중첩', () => {
    const effects: ActiveEffect[] = [
      { id: '1', type: 'buff', targetStat: 'atk', amount: 3, remainingTurns: 2, sourceName: '버프1' },
      { id: '2', type: 'buff', targetStat: 'atk', amount: 5, remainingTurns: 1, sourceName: '버프2' },
    ]
    // 10 + 3 + 5 = 18
    expect(getEffectiveStat(10, 'atk', effects)).toBe(18)
  })
})

describe('tickEffects', () => {
  it('모든 효과의 remainingTurns가 1 감소', () => {
    const effects: ActiveEffect[] = [
      { id: '1', type: 'buff', targetStat: 'atk', amount: 5, remainingTurns: 3, sourceName: '분노' },
      { id: '2', type: 'debuff', targetStat: 'def', amount: 3, remainingTurns: 1, sourceName: '약화' },
    ]
    const result = tickEffects(effects)
    expect(result).toHaveLength(1) // 두번째 효과 만료
    expect(result[0].remainingTurns).toBe(2)
  })

  it('모든 효과가 만료되면 빈 배열', () => {
    const effects: ActiveEffect[] = [
      { id: '1', type: 'buff', targetStat: 'atk', amount: 5, remainingTurns: 1, sourceName: '분노' },
    ]
    const result = tickEffects(effects)
    expect(result).toHaveLength(0)
  })

  it('빈 배열이면 빈 배열 반환', () => {
    expect(tickEffects([])).toHaveLength(0)
  })

  it('원본 배열을 변경하지 않음', () => {
    const effects: ActiveEffect[] = [
      { id: '1', type: 'buff', targetStat: 'atk', amount: 5, remainingTurns: 2, sourceName: '분노' },
    ]
    tickEffects(effects)
    expect(effects[0].remainingTurns).toBe(2)
  })
})

describe('addEffect', () => {
  it('새 효과가 추가됨', () => {
    const result = addEffect([], 'buff', 'atk', 5, 3, '분노')
    expect(result).toHaveLength(1)
    expect(result[0].type).toBe('buff')
    expect(result[0].targetStat).toBe('atk')
    expect(result[0].amount).toBe(5)
    expect(result[0].remainingTurns).toBe(3)
    expect(result[0].sourceName).toBe('분노')
  })

  it('기존 효과에 추가됨', () => {
    const existing: ActiveEffect[] = [
      { id: 'old', type: 'buff', targetStat: 'atk', amount: 3, remainingTurns: 1, sourceName: '기존' },
    ]
    const result = addEffect(existing, 'debuff', 'def', 5, 2, '약화')
    expect(result).toHaveLength(2)
    expect(result[0].id).toBe('old')
    expect(result[1].type).toBe('debuff')
  })

  it('원본 배열을 변경하지 않음', () => {
    const existing: ActiveEffect[] = []
    addEffect(existing, 'buff', 'atk', 5, 3, '분노')
    expect(existing).toHaveLength(0)
  })

  it('고유 ID가 생성됨', () => {
    const r1 = addEffect([], 'buff', 'atk', 5, 3, 'a')
    const r2 = addEffect([], 'buff', 'atk', 5, 3, 'b')
    expect(r1[0].id).not.toBe(r2[0].id)
  })

  it('같은 type+targetStat 효과는 교체 (중첩 방지)', () => {
    const existing: ActiveEffect[] = [
      { id: 'old', type: 'buff', targetStat: 'atk', amount: 3, remainingTurns: 1, sourceName: '기존' },
    ]
    const result = addEffect(existing, 'buff', 'atk', 5, 3, '새로운')
    expect(result).toHaveLength(1)
    expect(result[0].amount).toBe(5)
    expect(result[0].sourceName).toBe('새로운')
  })

  it('다른 type이면 중첩 허용 (buff atk + debuff atk)', () => {
    const existing: ActiveEffect[] = [
      { id: 'old', type: 'buff', targetStat: 'atk', amount: 3, remainingTurns: 1, sourceName: '버프' },
    ]
    const result = addEffect(existing, 'debuff', 'atk', 2, 2, '디버프')
    expect(result).toHaveLength(2)
  })

  it('다른 targetStat이면 중첩 허용 (buff atk + buff def)', () => {
    const existing: ActiveEffect[] = [
      { id: 'old', type: 'buff', targetStat: 'atk', amount: 3, remainingTurns: 1, sourceName: '공버프' },
    ]
    const result = addEffect(existing, 'buff', 'def', 5, 3, '방버프')
    expect(result).toHaveLength(2)
  })
})
