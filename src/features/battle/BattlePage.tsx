import { useState, useRef, useEffect } from 'react'
import { useBattleStore } from '../../stores/battle-store'
import { useGameStore } from '../../stores/game-store'
import { CharacterPanel } from './CharacterPanel'
import { ActionPanel } from './ActionPanel'
import { BattleLog } from './BattleLog'
import type { BattleAction, Character } from '../../types'

const QUEUE_DELAY = 600 // ms between queue items

export function BattlePage() {
  const battleState = useBattleStore((s) => s.battleState)
  const executePlayerAction = useBattleStore((s) => s.executePlayerAction)
  const processQueue = useBattleStore((s) => s.processQueue)
  const setPhase = useGameStore((s) => s.setPhase)

  const [isAnimating, setIsAnimating] = useState(false)
  // 큐 소비 중 표시할 캐릭터 스냅샷 (null이면 battleState의 값 사용)
  const [displayPlayer, setDisplayPlayer] = useState<Character | null>(null)
  const [displayEnemy, setDisplayEnemy] = useState<Character | null>(null)
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
  //
  // 흐름:
  //   handleAction → executePlayerAction(동기, 큐 적재)
  //     → startConsuming → processQueue → 스냅샷 적용
  //       → QUEUE_DELAY 후 다음 아이템 ... → 큐 비면 스냅샷 해제
  const startConsuming = () => {
    setIsAnimating(true)

    const consume = () => {
      const item = processQueue()
      if (item) {
        setDisplayPlayer(item.playerSnapshot)
        setDisplayEnemy(item.enemySnapshot)
        timerRef.current = setTimeout(consume, QUEUE_DELAY)
      } else {
        // 큐 소비 완료 → 스냅샷 해제, battleState의 최종값으로 복귀
        setDisplayPlayer(null)
        setDisplayEnemy(null)
        setIsAnimating(false)
        timerRef.current = null
      }
    }

    // 첫 아이템 즉시 처리
    const first = processQueue()
    if (first) {
      setDisplayPlayer(first.playerSnapshot)
      setDisplayEnemy(first.enemySnapshot)
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

  // 애니메이션 중이면 스냅샷 표시, 아니면 battleState의 최종값
  const shownPlayer = displayPlayer ?? player
  const shownEnemy = displayEnemy ?? enemy

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
          <CharacterPanel character={shownPlayer} side="player" />
          <CharacterPanel character={shownEnemy} side="enemy" />
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
