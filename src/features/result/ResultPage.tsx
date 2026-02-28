import { useBattleStore } from '../../stores/battle-store'
import { useGameStore } from '../../stores/game-store'
import { useSetupStore } from '../../stores/setup-store'

const RESULT_TEXT = {
  victory: '승리',
  defeat: '패배',
  draw: '무승부',
} as const

const RESULT_COLOR = {
  victory: 'text-yellow-400',
  defeat: 'text-red-400',
  draw: 'text-gray-400',
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
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center space-y-6">
        <h1
          data-testid="result-title"
          className={`text-4xl font-bold ${RESULT_COLOR[result]}`}
        >
          {RESULT_TEXT[result]}
        </h1>

        <p
          data-testid="result-turns"
          className="text-lg text-gray-300"
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
