import { describe, it, expect } from 'vitest'
import { nextPhase } from './battle-state-machine'

const base = { isPlayerFirst: true, isFirstAction: true, targetDead: false, roundExceeded: false }

describe('nextPhase', () => {
  describe('round-start', () => {
    it('플레이어 선공 → player-action', () => {
      expect(nextPhase('round-start', { ...base, isPlayerFirst: true })).toBe('player-action')
    })

    it('적 선공 → enemy-action', () => {
      expect(nextPhase('round-start', { ...base, isPlayerFirst: false })).toBe('enemy-action')
    })
  })

  describe('player-action', () => {
    it('대상 사망 → battle-end', () => {
      expect(nextPhase('player-action', { ...base, targetDead: true })).toBe('battle-end')
    })

    it('첫 행동이면 → enemy-action (후공)', () => {
      expect(nextPhase('player-action', { ...base, isFirstAction: true, targetDead: false })).toBe('enemy-action')
    })

    it('두번째 행동이면 → round-end', () => {
      expect(nextPhase('player-action', { ...base, isFirstAction: false, targetDead: false })).toBe('round-end')
    })
  })

  describe('enemy-action', () => {
    it('대상 사망 → battle-end', () => {
      expect(nextPhase('enemy-action', { ...base, targetDead: true })).toBe('battle-end')
    })

    it('첫 행동이면 → player-action (후공)', () => {
      expect(nextPhase('enemy-action', { ...base, isFirstAction: true, targetDead: false })).toBe('player-action')
    })

    it('두번째 행동이면 → round-end', () => {
      expect(nextPhase('enemy-action', { ...base, isFirstAction: false, targetDead: false })).toBe('round-end')
    })
  })

  describe('round-end', () => {
    it('라운드 초과 → battle-end', () => {
      expect(nextPhase('round-end', { ...base, roundExceeded: true })).toBe('battle-end')
    })

    it('라운드 미초과 → round-start', () => {
      expect(nextPhase('round-end', { ...base, roundExceeded: false })).toBe('round-start')
    })
  })

  describe('battle-end', () => {
    it('terminal 상태, 자기 자신 반환', () => {
      expect(nextPhase('battle-end', base)).toBe('battle-end')
    })
  })

  describe('전체 흐름 시뮬레이션', () => {
    it('플레이어 선공 → 양쪽 생존 → 라운드 종료', () => {
      let phase = nextPhase('round-start', { ...base, isPlayerFirst: true })
      expect(phase).toBe('player-action')

      phase = nextPhase(phase, { ...base, isFirstAction: true, targetDead: false })
      expect(phase).toBe('enemy-action')

      phase = nextPhase(phase, { ...base, isFirstAction: false, targetDead: false })
      expect(phase).toBe('round-end')

      phase = nextPhase(phase, { ...base, roundExceeded: false })
      expect(phase).toBe('round-start')
    })

    it('적 선공 → 적 공격 → 플레이어 사망', () => {
      let phase = nextPhase('round-start', { ...base, isPlayerFirst: false })
      expect(phase).toBe('enemy-action')

      phase = nextPhase(phase, { ...base, isFirstAction: true, targetDead: true })
      expect(phase).toBe('battle-end')
    })
  })
})
