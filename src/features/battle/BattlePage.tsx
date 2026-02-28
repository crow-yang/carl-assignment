import { useEffect } from 'react'
import { useBattleStore } from '../../stores/battle-store'
import { useGameStore } from '../../stores/game-store'
import { CharacterPanel } from './CharacterPanel'
import { ActionPanel } from './ActionPanel'
import { BattleLog } from './BattleLog'
import { useQueueAnimation } from './useQueueAnimation'
import type { BattleAction } from '../../types'

export function BattlePage() {
  const battleState = useBattleStore((s) => s.battleState)
  const executePlayerAction = useBattleStore((s) => s.executePlayerAction)
  const processQueue = useBattleStore((s) => s.processQueue)
  const setPhase = useGameStore((s) => s.setPhase)

  const { isAnimating, displayPlayer, displayEnemy, startConsuming, getVisibleLog } =
    useQueueAnimation(processQueue)

  // 전투 종료 시 결과 화면 전환 (외부 시스템 동기화 — 타이머)
  useEffect(() => {
    if (battleState?.result && !isAnimating) {
      const timer = setTimeout(() => setPhase('result'), 1500)
      return () => clearTimeout(timer)
    }
  }, [battleState?.result, isAnimating, setPhase])

  if (!battleState) return null

  const { player, enemy, round, result, log } = battleState

  const handleAction = (action: BattleAction) => {
    if (isAnimating || result) return
    executePlayerAction(action)
    startConsuming(log.length)
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

        {/* 전투 로그 — 애니메이션 중엔 큐 소비 속도에 맞춰 점진적 공개 */}
        <BattleLog log={getVisibleLog(log)} />
      </div>
    </div>
  )
}
