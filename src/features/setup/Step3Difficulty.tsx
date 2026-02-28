import { useSetupStore } from '../../stores/setup-store'
import { useBattleStore } from '../../stores/battle-store'
import { useGameStore } from '../../stores/game-store'
import { DIFFICULTY_LABELS, DIFFICULTY_DESCRIPTIONS, ENEMY_STATS } from '../../constants'
import type { Difficulty, StatType } from '../../types'

const DIFFICULTIES: Difficulty[] = ['easy', 'normal', 'hard']
const DISPLAY_STATS: StatType[] = ['hp', 'mp', 'atk', 'def', 'spd']

export function Step3Difficulty() {
  const difficulty = useSetupStore((s) => s.difficulty)
  const setDifficulty = useSetupStore((s) => s.setDifficulty)
  const prevStep = useSetupStore((s) => s.prevStep)
  const name = useSetupStore((s) => s.name)
  const stats = useSetupStore((s) => s.stats)
  const getAllSkills = useSetupStore((s) => s.getAllSkills)
  const initBattle = useBattleStore((s) => s.initBattle)
  const setPhase = useGameStore((s) => s.setPhase)

  const handleStartBattle = () => {
    if (!difficulty) return
    initBattle(name, stats, getAllSkills(), difficulty)
    setPhase('battle')
  }

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">난이도 선택</h3>

      <div className="grid gap-4">
        {DIFFICULTIES.map((d) => {
          const enemyStats = ENEMY_STATS[d]
          const isSelected = difficulty === d

          return (
            <button
              key={d}
              data-testid={`difficulty-${d}`}
              onClick={() => setDifficulty(d)}
              className={`p-4 rounded-lg border-2 text-left transition-colors ${
                isSelected
                  ? 'border-blue-500 bg-blue-500/10'
                  : 'border-gray-700 bg-gray-800 hover:border-gray-500'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-lg font-bold">{DIFFICULTY_LABELS[d]}</span>
                <span className="text-sm text-gray-400">{DIFFICULTY_DESCRIPTIONS[d]}</span>
              </div>
              <div className="flex gap-3 text-xs text-gray-400">
                {DISPLAY_STATS.map((stat) => (
                  <span key={stat}>
                    {stat.toUpperCase()} {enemyStats[stat]}
                  </span>
                ))}
              </div>
            </button>
          )
        })}
      </div>

      {/* 네비게이션 */}
      <div className="flex justify-between">
        <button
          data-testid="prev-button"
          onClick={prevStep}
          className="px-6 py-2 bg-gray-700 text-gray-300 rounded-lg font-medium hover:bg-gray-600 transition-colors"
        >
          이전
        </button>
        <button
          data-testid="start-battle-button"
          onClick={handleStartBattle}
          disabled={!difficulty}
          className="px-6 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-500 disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors"
        >
          전투 시작
        </button>
      </div>
    </div>
  )
}
