import { useState, useRef, useEffect, useCallback } from 'react'
import type { ActionQueueItem, Character, TurnLogEntry } from '../../types'

const QUEUE_DELAY = 600 // ms between queue items

interface UseQueueAnimationReturn {
  isAnimating: boolean
  displayPlayer: Character | null
  displayEnemy: Character | null
  /** 현재 재생 중인 큐 아이템 (DamagePopup, CharacterPanel 이펙트에 사용) */
  currentItem: ActionQueueItem | null
  /** 큐 소비 시작. executePlayerAction 호출 직후에 호출한다. */
  startConsuming: (currentLogLength: number) => void
  /** 현재 표시해야 할 로그 슬라이스를 반환 */
  getVisibleLog: (fullLog: TurnLogEntry[]) => TurnLogEntry[]
}

/**
 * 전투 액션 큐의 순차 소비와 애니메이션 상태를 관리하는 훅.
 *
 * @param processQueue - Zustand store의 processQueue 함수.
 *   **참조 안정성 필수**: 매 렌더마다 새 함수를 전달하면 안 됨.
 *   Zustand의 액션 함수는 참조가 안정적이므로 그대로 전달.
 */
export function useQueueAnimation(
  processQueue: () => ActionQueueItem | null,
): UseQueueAnimationReturn {
  const [isAnimating, setIsAnimating] = useState(false)
  const [displayPlayer, setDisplayPlayer] = useState<Character | null>(null)
  const [displayEnemy, setDisplayEnemy] = useState<Character | null>(null)
  const [currentItem, setCurrentItem] = useState<ActionQueueItem | null>(null)
  const [prevLogLength, setPrevLogLength] = useState(0)
  const [revealedCount, setRevealedCount] = useState(0)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  const startConsuming = useCallback((currentLogLength: number) => {
    setPrevLogLength(currentLogLength)
    setRevealedCount(0)
    setIsAnimating(true)

    const consume = () => {
      const item = processQueue()
      if (item) {
        setCurrentItem(item)
        setDisplayPlayer(item.playerSnapshot)
        setDisplayEnemy(item.enemySnapshot)
        setRevealedCount((c) => c + 1)
        timerRef.current = setTimeout(consume, QUEUE_DELAY)
      } else {
        setCurrentItem(null)
        setDisplayPlayer(null)
        setDisplayEnemy(null)
        setIsAnimating(false)
        timerRef.current = null
      }
    }

    // 첫 아이템 즉시 처리
    const first = processQueue()
    if (first) {
      setCurrentItem(first)
      setDisplayPlayer(first.playerSnapshot)
      setDisplayEnemy(first.enemySnapshot)
      setRevealedCount(1)
      timerRef.current = setTimeout(consume, QUEUE_DELAY)
    } else {
      setIsAnimating(false)
    }
  }, [processQueue])

  const getVisibleLog = useCallback((fullLog: TurnLogEntry[]): TurnLogEntry[] => {
    if (!isAnimating) return fullLog
    return fullLog.slice(0, prevLogLength + revealedCount)
  }, [isAnimating, prevLogLength, revealedCount])

  return {
    isAnimating,
    displayPlayer,
    displayEnemy,
    currentItem,
    startConsuming,
    getVisibleLog,
  }
}
