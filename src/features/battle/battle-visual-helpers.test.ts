import { describe, it, expect } from 'vitest'
import { shouldShowPopup, getActiveEffect, getPopupDisplay } from './battle-visual-helpers'
import type { ActionQueueItem, Character } from '../../types'

const makeCharacter = (): Character => ({
  name: '테스트',
  baseStats: { hp: 100, mp: 50, atk: 15, def: 10, spd: 10 },
  currentHp: 80,
  currentMp: 40,
  skills: [],
  activeEffects: [],
})

const makeItem = (overrides: Partial<ActionQueueItem> = {}): ActionQueueItem => ({
  type: 'damage',
  actor: 'player',
  actorName: '플레이어',
  description: '공격!',
  value: 10,
  logEntry: { round: 1, actor: 'player', actorName: '플레이어', skillType: 'attack', action: '공격!' },
  playerSnapshot: makeCharacter(),
  enemySnapshot: makeCharacter(),
  ...overrides,
})

// ─── shouldShowPopup ──────────────────────────────────────

describe('shouldShowPopup', () => {
  it('null item → false', () => {
    expect(shouldShowPopup(null, 'player')).toBe(false)
    expect(shouldShowPopup(null, 'enemy')).toBe(false)
  })

  // damage: 대상(actor 반대편)에 표시
  it('damage + player actor → enemy 패널에 표시', () => {
    const item = makeItem({ type: 'damage', actor: 'player' })
    expect(shouldShowPopup(item, 'enemy')).toBe(true)
    expect(shouldShowPopup(item, 'player')).toBe(false)
  })

  it('damage + enemy actor → player 패널에 표시', () => {
    const item = makeItem({ type: 'damage', actor: 'enemy' })
    expect(shouldShowPopup(item, 'player')).toBe(true)
    expect(shouldShowPopup(item, 'enemy')).toBe(false)
  })

  // heal: 시전자 패널에 표시
  it('heal + player actor → player 패널에 표시', () => {
    const item = makeItem({ type: 'heal', actor: 'player', value: 20 })
    expect(shouldShowPopup(item, 'player')).toBe(true)
    expect(shouldShowPopup(item, 'enemy')).toBe(false)
  })

  it('heal + enemy actor → enemy 패널에 표시', () => {
    const item = makeItem({ type: 'heal', actor: 'enemy', value: 20 })
    expect(shouldShowPopup(item, 'enemy')).toBe(true)
    expect(shouldShowPopup(item, 'player')).toBe(false)
  })

  // defend/buff/debuff: 팝업 없음
  it('defend → 양쪽 모두 false', () => {
    const item = makeItem({ type: 'defend', actor: 'player' })
    expect(shouldShowPopup(item, 'player')).toBe(false)
    expect(shouldShowPopup(item, 'enemy')).toBe(false)
  })

  it('buff → 양쪽 모두 false', () => {
    const item = makeItem({ type: 'buff', actor: 'player' })
    expect(shouldShowPopup(item, 'player')).toBe(false)
    expect(shouldShowPopup(item, 'enemy')).toBe(false)
  })

  it('debuff → 양쪽 모두 false', () => {
    const item = makeItem({ type: 'debuff', actor: 'enemy' })
    expect(shouldShowPopup(item, 'player')).toBe(false)
    expect(shouldShowPopup(item, 'enemy')).toBe(false)
  })
})

// ─── getActiveEffect ──────────────────────────────────────

describe('getActiveEffect', () => {
  it('null item → null', () => {
    expect(getActiveEffect(null, 'player')).toBeNull()
    expect(getActiveEffect(null, 'enemy')).toBeNull()
  })

  // damage: 대상에게 shake
  it('damage + player actor → enemy에 shake', () => {
    const item = makeItem({ type: 'damage', actor: 'player' })
    expect(getActiveEffect(item, 'enemy')).toBe('shake')
    expect(getActiveEffect(item, 'player')).toBeNull()
  })

  it('damage + enemy actor → player에 shake', () => {
    const item = makeItem({ type: 'damage', actor: 'enemy' })
    expect(getActiveEffect(item, 'player')).toBe('shake')
    expect(getActiveEffect(item, 'enemy')).toBeNull()
  })

  // heal: 시전자에게 pulse-heal
  it('heal + player actor → player에 pulse-heal', () => {
    const item = makeItem({ type: 'heal', actor: 'player', value: 20 })
    expect(getActiveEffect(item, 'player')).toBe('pulse-heal')
    expect(getActiveEffect(item, 'enemy')).toBeNull()
  })

  it('heal + enemy actor → enemy에 pulse-heal', () => {
    const item = makeItem({ type: 'heal', actor: 'enemy', value: 20 })
    expect(getActiveEffect(item, 'enemy')).toBe('pulse-heal')
    expect(getActiveEffect(item, 'player')).toBeNull()
  })

  // defend/buff/debuff: 이펙트 없음
  it('defend → 양쪽 null', () => {
    const item = makeItem({ type: 'defend', actor: 'player' })
    expect(getActiveEffect(item, 'player')).toBeNull()
    expect(getActiveEffect(item, 'enemy')).toBeNull()
  })

  it('buff → 양쪽 null', () => {
    const item = makeItem({ type: 'buff', actor: 'player' })
    expect(getActiveEffect(item, 'player')).toBeNull()
    expect(getActiveEffect(item, 'enemy')).toBeNull()
  })

  it('debuff → 양쪽 null', () => {
    const item = makeItem({ type: 'debuff', actor: 'enemy' })
    expect(getActiveEffect(item, 'player')).toBeNull()
    expect(getActiveEffect(item, 'enemy')).toBeNull()
  })
})

// ─── getPopupDisplay ──────────────────────────────────────

describe('getPopupDisplay', () => {
  it('damage → 빨간색 -값', () => {
    const item = makeItem({ type: 'damage', value: 15 })
    expect(getPopupDisplay(item)).toEqual({ text: '-15', colorClass: 'text-red-400' })
  })

  it('heal → 초록색 +값', () => {
    const item = makeItem({ type: 'heal', value: 20 })
    expect(getPopupDisplay(item)).toEqual({ text: '+20', colorClass: 'text-green-400' })
  })

  it('damage value undefined → -0 표시', () => {
    const item = makeItem({ type: 'damage', value: undefined })
    expect(getPopupDisplay(item)).toEqual({ text: '-0', colorClass: 'text-red-400' })
  })

  it('heal value undefined → +0 표시', () => {
    const item = makeItem({ type: 'heal', value: undefined })
    expect(getPopupDisplay(item)).toEqual({ text: '+0', colorClass: 'text-green-400' })
  })

  it('defend → 빈 텍스트', () => {
    const item = makeItem({ type: 'defend' })
    expect(getPopupDisplay(item)).toEqual({ text: '', colorClass: '' })
  })

  it('buff → 빈 텍스트', () => {
    const item = makeItem({ type: 'buff' })
    expect(getPopupDisplay(item)).toEqual({ text: '', colorClass: '' })
  })

  it('debuff → 빈 텍스트', () => {
    const item = makeItem({ type: 'debuff' })
    expect(getPopupDisplay(item)).toEqual({ text: '', colorClass: '' })
  })

  it('effect-expire → 빈 텍스트', () => {
    const item = makeItem({ type: 'effect-expire' })
    expect(getPopupDisplay(item)).toEqual({ text: '', colorClass: '' })
  })
})
