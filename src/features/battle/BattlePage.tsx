import { useState, useRef, useEffect } from 'react'
import { useBattleStore } from '../../stores/battle-store'
import { useGameStore } from '../../stores/game-store'
import { CharacterPanel } from './CharacterPanel'
import { ActionPanel } from './ActionPanel'
import { BattleLog } from './BattleLog'
import type { BattleAction } from '../../types'

const QUEUE_DELAY = 600 // ms between queue items

export function BattlePage() {
  const battleState = useBattleStore((s) => s.battleState)
  const executePlayerAction = useBattleStore((s) => s.executePlayerAction)
  const processQueue = useBattleStore((s) => s.processQueue)
  const setPhase = useGameStore((s) => s.setPhase)

  const [isAnimating, setIsAnimating] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  // 전투 종료 시 결과 화면 전환 (외부 시스템 동기화 — 타이머)
  useEffect(() => {
    if (battleState?.result && !isAnimating) {
      const timer = setTimeout(() => setPhase('result'), 1500)
      return () => clearTimeout(timer)
    }
  }, [battleState?.result, isAnimating, setPhase])

  if (!battleState) return null

  const { player, enemy, round, result, log } = battleState

  // 큐 순차 소비 — 이벤트 핸들러에서 직접 호출 (effect 아님)
  const startConsuming = () => {
    setIsAnimating(true)

    const consume = () => {
      const item = processQueue()
      if (item) {
        timerRef.current = setTimeout(consume, QUEUE_DELAY)
      } else {
        setIsAnimating(false)
        timerRef.current = null
      }
    }

    // 첫 아이템 즉시 처리
    const first = processQueue()
    if (first) {
      timerRef.current = setTimeout(consume, QUEUE_DELAY)
    } else {
      setIsAnimating(false)
    }
  }

  const handleAction = (action: BattleAction) => {
    if (isAnimating || result) return
    executePlayerAction(action)
    // executePlayerAction은 동기적으로 큐를 채움 → 바로 소비 시작
    startConsuming()
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-4">
        {/* 라운드 표시 */}
        <div className="text-center">
          <span
            data-testid="round-display"
            className="text-lg font-bold text-yellow-400"
          >
            Round {round}
          </span>
          {result && (
            <span className="ml-4 text-lg font-bold text-white">
              {result === 'victory' ? '승리!' : result === 'defeat' ? '패배...' : '무승부'}
            </span>
          )}
        </div>

        {/* 캐릭터 패널 */}
        <div className="grid grid-cols-2 gap-4">
          <CharacterPanel character={player} side="player" />
          <CharacterPanel character={enemy} side="enemy" />
        </div>

        {/* 액션 패널 */}
        <div className="text-center">
          <ActionPanel
            player={player}
            onAction={handleAction}
            disabled={isAnimating || !!result}
          />
        </div>

        {/* 전투 로그 */}
        <BattleLog log={log} />
      </div>
    </div>
  )
}
