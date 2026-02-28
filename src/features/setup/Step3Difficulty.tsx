import { useSetupStore } from '../../stores/setup-store'
import { useBattleStore } from '../../stores/battle-store'
import { useGameStore } from '../../stores/game-store'
import { DIFFICULTY_LABELS, DIFFICULTY_DESCRIPTIONS, ENEMY_STATS, STAT_LABELS } from '../../constants'
import type { Difficulty, StatType } from '../../types'

const DIFFICULTIES: Difficulty[] = ['easy', 'normal', 'hard']
const DISPLAY_STATS: StatType[] = ['hp', 'mp', 'atk', 'def', 'spd']

const DIFFICULTY_THEME: Record<Difficulty, {
  icon: string
  selectedBorder: string
  selectedBg: string
  selectedShadow: string
  iconBg: string
}> = {
  easy: {
    icon: '🟢',
    selectedBorder: 'border-green-500',
    selectedBg: 'bg-green-500/10',
    selectedShadow: 'shadow-green-500/20',
    iconBg: 'bg-green-900/40',
  },
  normal: {
    icon: '🟡',
    selectedBorder: 'border-yellow-500',
    selectedBg: 'bg-yellow-500/10',
    selectedShadow: 'shadow-yellow-500/20',
    iconBg: 'bg-yellow-900/40',
  },
  hard: {
    icon: '🔴',
    selectedBorder: 'border-red-500',
    selectedBg: 'bg-red-500/10',
    selectedShadow: 'shadow-red-500/20',
    iconBg: 'bg-red-900/40',
  },
}

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
      <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">난이도 선택</h3>

      <div className="grid gap-3">
        {DIFFICULTIES.map((d) => {
          const enemyStats = ENEMY_STATS[d]
          const isSelected = difficulty === d
          const theme = DIFFICULTY_THEME[d]

          return (
            <button
              key={d}
              data-testid={`difficulty-${d}`}
              aria-pressed={isSelected}
              onClick={() => setDifficulty(d)}
              className={`p-4 rounded-xl border-2 text-left transition-all ${
                isSelected
                  ? `${theme.selectedBorder} ${theme.selectedBg} shadow-lg ${theme.selectedShadow}`
                  : 'border-gray-700/60 bg-gray-800/80 hover:border-gray-500 hover:shadow-md'
              }`}
            >
              <div className="flex items-center gap-3 mb-3">
                <span className={`w-10 h-10 rounded-lg ${theme.iconBg} flex items-center justify-center text-xl`} aria-hidden="true">
                  {theme.icon}
                </span>
                <div>
                  <span className="text-lg font-bold block">{DIFFICULTY_LABELS[d]}</span>
                  <span className="text-xs text-gray-400">{DIFFICULTY_DESCRIPTIONS[d]}</span>
                </div>
              </div>
              <div className="grid grid-cols-5 gap-1">
                {DISPLAY_STATS.map((stat) => (
                  <div key={stat} className="text-center p-1.5 bg-gray-900/50 rounded">
                    <div className="text-[10px] text-gray-500">{STAT_LABELS[stat]}</div>
                    <div className="text-sm font-semibold">{enemyStats[stat]}</div>
                  </div>
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
          className="px-6 py-2 bg-gray-700 text-gray-300 rounded-xl font-medium hover:bg-gray-600 transition-colors"
        >
          이전
        </button>
        <button
          data-testid="start-battle-button"
          onClick={handleStartBattle}
          disabled={!difficulty}
          className="px-6 py-2 bg-red-600 text-white rounded-xl font-medium hover:bg-red-500 disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors shadow-lg shadow-red-600/20 disabled:shadow-none"
        >
          전투 시작
        </button>
      </div>
    </div>
  )
}
