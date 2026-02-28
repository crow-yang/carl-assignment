import { useBattleStore } from '../../stores/battle-store'
import { useGameStore } from '../../stores/game-store'
import { useSetupStore } from '../../stores/setup-store'
import type { Character, TurnLogEntry } from '../../types'

const RESULT_CONFIG = {
  victory: { text: '승리', emoji: '🏆', color: 'text-yellow-400', glow: 'drop-shadow-[0_0_24px_rgba(250,204,21,0.5)]' },
  defeat:  { text: '패배', emoji: '💀', color: 'text-red-400', glow: 'drop-shadow-[0_0_24px_rgba(248,113,113,0.4)]' },
  draw:    { text: '무승부', emoji: '🤝', color: 'text-gray-400', glow: 'drop-shadow-[0_0_16px_rgba(156,163,175,0.3)]' },
} as const

function HpBar({ character, side }: { character: Character; side: 'player' | 'enemy' }) {
  const percent = Math.max(0, (character.currentHp / character.baseStats.hp) * 100)
  const barColor = side === 'player' ? 'from-blue-600 to-blue-400' : 'from-red-600 to-red-400'
  return (
    <div className="text-sm">
      <div className="flex justify-between text-xs mb-1">
        <span className="font-medium">{character.name}</span>
        <span>{character.currentHp} / {character.baseStats.hp}</span>
      </div>
      <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full bg-linear-to-r ${barColor} transition-all`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  )
}

function getBattleStats(log: TurnLogEntry[], side: 'player' | 'enemy') {
  const entries = log.filter((e) => e.actor === side)
  const totalDamage = entries.reduce((sum, e) => sum + (e.damage ?? 0), 0)
  const totalHeal = entries.reduce((sum, e) => sum + (e.heal ?? 0), 0)
  return { totalDamage, totalHeal, actionCount: entries.length }
}

export function ResultPage() {
  const battleState = useBattleStore((s) => s.battleState)
  const resetBattle = useBattleStore((s) => s.reset)
  const resetSetup = useSetupStore((s) => s.reset)
  const setPhase = useGameStore((s) => s.setPhase)

  const result = battleState?.result ?? null
  const totalRounds = battleState?.round ?? 0

  if (!result) return null

  const handleRestart = () => {
    resetBattle()
    resetSetup()
    setPhase('setup')
  }

  const playerStats = getBattleStats(battleState!.log, 'player')
  const enemyStats = getBattleStats(battleState!.log, 'enemy')

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md text-center space-y-6 animate-slide-up">
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

        {/* 전투 리캡 */}
        <div className="p-4 bg-gray-800/80 rounded-xl border border-gray-700/50 space-y-3 text-left">
          <h2 className="text-sm font-semibold text-gray-300 text-center">전투 요약</h2>
          <HpBar character={battleState!.player} side="player" />
          <HpBar character={battleState!.enemy} side="enemy" />
          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-700/50">
            <div className="text-xs space-y-1">
              <p className="text-blue-400 font-medium">{battleState!.player.name}</p>
              <p className="text-gray-400">총 데미지: <span className="text-white">{playerStats.totalDamage}</span></p>
              {playerStats.totalHeal > 0 && (
                <p className="text-gray-400">총 회복: <span className="text-green-400">{playerStats.totalHeal}</span></p>
              )}
            </div>
            <div className="text-xs space-y-1">
              <p className="text-red-400 font-medium">{battleState!.enemy.name}</p>
              <p className="text-gray-400">총 데미지: <span className="text-white">{enemyStats.totalDamage}</span></p>
              {enemyStats.totalHeal > 0 && (
                <p className="text-gray-400">총 회복: <span className="text-green-400">{enemyStats.totalHeal}</span></p>
              )}
            </div>
          </div>
        </div>

        <button
          data-testid="restart-button"
          onClick={handleRestart}
          className="px-8 py-3 bg-blue-600 text-white rounded-xl font-medium text-lg hover:bg-blue-500 shadow-lg shadow-blue-600/30 transition-colors"
        >
          다시 시작
        </button>
      </div>
    </div>
  )
}
