import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useQueueAnimation } from './useQueueAnimation'
import type { ActionQueueItem, Character } from '../../types'

const makeCharacter = (hp: number, mp: number): Character => ({
  name: '테스트',
  baseStats: { hp: 100, mp: 50, atk: 15, def: 10, spd: 10 },
  currentHp: hp,
  currentMp: mp,
  skills: [],
  activeEffects: [],
})

const makeQueueItem = (overrides: Partial<ActionQueueItem> = {}): ActionQueueItem => ({
  type: 'damage',
  actor: 'player',
  actorName: '플레이어',
  description: '공격!',
  value: 10,
  logEntry: { id: 'test-log', round: 1, actor: 'player', actorName: '플레이어', skillType: 'attack', action: '공격!' },
  playerSnapshot: makeCharacter(90, 50),
  enemySnapshot: makeCharacter(80, 30),
  ...overrides,
})

describe('useQueueAnimation', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('초기 상태: 애니메이션 비활성, 스냅샷 null', () => {
    const processQueue = vi.fn(() => null)
    const { result } = renderHook(() => useQueueAnimation(processQueue))

    expect(result.current.isAnimating).toBe(false)
    expect(result.current.displayPlayer).toBeNull()
    expect(result.current.displayEnemy).toBeNull()
    expect(result.current.currentItem).toBeNull()
  })

  it('빈 큐에서 startConsuming: 즉시 isAnimating=false', () => {
    const processQueue = vi.fn(() => null)
    const { result } = renderHook(() => useQueueAnimation(processQueue))

    act(() => result.current.startConsuming(0))

    expect(result.current.isAnimating).toBe(false)
    expect(processQueue).toHaveBeenCalledTimes(1)
  })

  it('큐 아이템 1개 소비: 스냅샷 설정 → 타이머 후 리셋', () => {
    const item = makeQueueItem()
    let callCount = 0
    const processQueue = vi.fn(() => {
      callCount++
      return callCount === 1 ? item : null
    })

    const { result } = renderHook(() => useQueueAnimation(processQueue))

    act(() => result.current.startConsuming(0))

    // 첫 아이템 즉시 처리됨
    expect(result.current.isAnimating).toBe(true)
    expect(result.current.currentItem).toBe(item)
    expect(result.current.displayPlayer).toBe(item.playerSnapshot)
    expect(result.current.displayEnemy).toBe(item.enemySnapshot)

    // 600ms 후 다음 아이템 시도 → null → 리셋
    act(() => vi.advanceTimersByTime(600))

    expect(result.current.isAnimating).toBe(false)
    expect(result.current.currentItem).toBeNull()
    expect(result.current.displayPlayer).toBeNull()
  })

  it('큐 아이템 2개 순차 소비', () => {
    const item1 = makeQueueItem({ value: 10 })
    const item2 = makeQueueItem({ actor: 'enemy', actorName: '적', value: 5 })
    const items = [item1, item2]
    let idx = 0
    const processQueue = vi.fn(() => idx < items.length ? items[idx++] : null)

    const { result } = renderHook(() => useQueueAnimation(processQueue))

    act(() => result.current.startConsuming(0))

    // 첫 아이템
    expect(result.current.currentItem).toBe(item1)

    // 600ms → 두 번째 아이템
    act(() => vi.advanceTimersByTime(600))
    expect(result.current.currentItem).toBe(item2)
    expect(result.current.isAnimating).toBe(true)

    // 600ms → 큐 비어서 리셋
    act(() => vi.advanceTimersByTime(600))
    expect(result.current.isAnimating).toBe(false)
    expect(result.current.currentItem).toBeNull()
  })

  it('getVisibleLog: 애니메이션 중 점진적 공개', () => {
    const item = makeQueueItem()
    let callCount = 0
    const processQueue = vi.fn(() => {
      callCount++
      return callCount === 1 ? item : null
    })

    const { result } = renderHook(() => useQueueAnimation(processQueue))

    const fullLog = [
      { id: 'log-1', round: 1, actor: 'player' as const, actorName: 'A', skillType: 'attack' as const, action: '행동1' },
      { id: 'log-2', round: 1, actor: 'enemy' as const, actorName: 'B', skillType: 'attack' as const, action: '행동2' },
    ]

    // 애니메이션 전: 전체 로그
    expect(result.current.getVisibleLog(fullLog)).toHaveLength(2)

    // startConsuming(prevLogLength=0) → 1개 공개
    act(() => result.current.startConsuming(0))
    expect(result.current.getVisibleLog(fullLog)).toHaveLength(1)

    // 애니메이션 종료 후: 전체 로그
    act(() => vi.advanceTimersByTime(600))
    expect(result.current.getVisibleLog(fullLog)).toHaveLength(2)
  })

  it('unmount 시 타이머 정리', () => {
    const item = makeQueueItem()
    let callCount = 0
    const processQueue = vi.fn(() => {
      callCount++
      return callCount === 1 ? item : null
    })

    const { result, unmount } = renderHook(() => useQueueAnimation(processQueue))

    act(() => result.current.startConsuming(0))
    expect(result.current.isAnimating).toBe(true)

    // unmount — 타이머가 남아있어도 에러 없이 정리
    unmount()

    // 남은 타이머 실행해도 에러 없음
    act(() => vi.advanceTimersByTime(600))
  })
})
