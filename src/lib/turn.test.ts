import { describe, it, expect } from 'vitest'
import { determineFirstMover, checkBattleEnd } from './turn'

describe('determineFirstMover', () => {
  it('SPD가 높은 쪽이 선공', () => {
    expect(determineFirstMover(15, 10)).toBe('player')
    expect(determineFirstMover(10, 15)).toBe('enemy')
  })

  it('SPD 동일 시 rng로 결정', () => {
    // rng가 0.3 반환 → player (< 0.5)
    expect(determineFirstMover(10, 10, () => 0.3)).toBe('player')
    // rng가 0.7 반환 → enemy (>= 0.5)
    expect(determineFirstMover(10, 10, () => 0.7)).toBe('enemy')
  })

  it('SPD 동일, rng 경계값 0.5 → enemy', () => {
    expect(determineFirstMover(10, 10, () => 0.5)).toBe('enemy')
  })
})

describe('checkBattleEnd', () => {
  it('적 HP ≤ 0 → 승리', () => {
    expect(checkBattleEnd(50, 0, 5)).toBe('victory')
    expect(checkBattleEnd(50, -10, 5)).toBe('victory')
  })

  it('플레이어 HP ≤ 0 → 패배', () => {
    expect(checkBattleEnd(0, 50, 5)).toBe('defeat')
    expect(checkBattleEnd(-5, 50, 5)).toBe('defeat')
  })

  it('양쪽 모두 HP ≤ 0 → 무승부 (공정성)', () => {
    expect(checkBattleEnd(0, 0, 5)).toBe('draw')
    expect(checkBattleEnd(-5, -10, 3)).toBe('draw')
  })

  it('20턴 초과 → 무승부', () => {
    expect(checkBattleEnd(50, 50, 21)).toBe('draw')
  })

  it('20턴째는 계속 진행', () => {
    expect(checkBattleEnd(50, 50, 20)).toBeNull()
  })

  it('양쪽 생존, 20턴 이하 → null', () => {
    expect(checkBattleEnd(100, 80, 1)).toBeNull()
  })
})
