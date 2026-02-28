import { useBattleStore } from '../../stores/battle-store'
import { useGameStore } from '../../stores/game-store'
import { useSetupStore } from '../../stores/setup-store'

const RESULT_CONFIG = {
  victory: { text: '승리', emoji: '🏆', color: 'text-yellow-400', glow: 'drop-shadow-[0_0_24px_rgba(250,204,21,0.5)]' },
  defeat:  { text: '패배', emoji: '💀', color: 'text-red-400', glow: '' },
  draw:    { text: '무승부', emoji: '🤝', color: 'text-gray-400', glow: '' },
} as const

export function ResultPage() {
  const result = useBattleStore((s) => s.battleState?.result ?? null)
  const totalRounds = useBattleStore((s) => s.battleState?.round ?? 0)
  const resetBattle = useBattleStore((s) => s.reset)
  const resetSetup = useSetupStore((s) => s.reset)
  const setPhase = useGameStore((s) => s.setPhase)

  if (!result) return null

  const handleRestart = () => {
    resetBattle()
    resetSetup()
    setPhase('setup')
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center space-y-6 animate-slide-up">
        <div className="text-6xl mb-2" aria-hidden="true">{RESULT_CONFIG[result].emoji}</div>
        <h1
          data-testid="result-title"
          className={`text-3xl sm:text-5xl font-black ${RESULT_CONFIG[result].color} ${RESULT_CONFIG[result].glow}`}
        >
          {RESULT_CONFIG[result].text}
        </h1>

        <p
          data-testid="result-turns"
          className="text-lg text-gray-400"
        >
          총 {totalRounds}턴
        </p>

        <button
          data-testid="restart-button"
          onClick={handleRestart}
          className="px-8 py-3 bg-blue-600 text-white rounded-lg font-medium text-lg hover:bg-blue-500 transition-colors"
        >
          다시 시작
        </button>
      </div>
    </div>
  )
}
