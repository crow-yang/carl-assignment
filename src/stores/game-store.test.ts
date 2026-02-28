import { describe, it, expect, beforeEach } from 'vitest'
import { useGameStore } from './game-store'

describe('game-store', () => {
  beforeEach(() => {
    useGameStore.getState().reset()
  })

  it('초기 상태는 setup', () => {
    expect(useGameStore.getState().phase).toBe('setup')
  })

  it('setPhase로 상태 전환', () => {
    useGameStore.getState().setPhase('battle')
    expect(useGameStore.getState().phase).toBe('battle')

    useGameStore.getState().setPhase('result')
    expect(useGameStore.getState().phase).toBe('result')
  })

  it('reset으로 setup으로 복귀', () => {
    useGameStore.getState().setPhase('result')
    useGameStore.getState().reset()
    expect(useGameStore.getState().phase).toBe('setup')
  })
})
