import type { Character } from '../../types'
import type { VisualEffect } from './battle-visual-helpers'

interface CharacterPanelProps {
  character: Character
  side: 'player' | 'enemy'
  activeEffect?: VisualEffect
}

const EFFECT_CLASS: Record<string, string> = {
  'hit-flash': 'animate-hit-flash',
  'pulse-heal': 'animate-pulse-heal',
  'shake': 'animate-shake',
}

export function CharacterPanel({ character, side, activeEffect }: CharacterPanelProps) {
  const hpPercent = Math.max(0, (character.currentHp / character.baseStats.hp) * 100)
  const mpPercent = Math.max(0, (character.currentMp / character.baseStats.mp) * 100)

  const testIdPrefix = side === 'player' ? 'player' : 'enemy'
  const buffs = character.activeEffects.filter((e) => e.type === 'buff')
  const debuffs = character.activeEffects.filter((e) => e.type === 'debuff')
  const effectClass = activeEffect ? EFFECT_CLASS[activeEffect] ?? '' : ''

  return (
    <div
      data-testid={`${testIdPrefix}-panel`}
      className={`p-4 bg-gray-800 rounded-lg border-2 ${
        side === 'player' ? 'border-blue-800' : 'border-red-800'
      } ${effectClass}`}
    >
      {/* 캐릭터 아바타 + 이름 */}
      <div className="flex items-center gap-2 mb-3">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl ${
          side === 'player'
            ? 'bg-linear-to-br from-blue-600 to-blue-800 ring-2 ring-blue-400'
            : 'bg-linear-to-br from-red-600 to-red-800 ring-2 ring-red-400'
        }`}>
          <span aria-hidden="true">{side === 'player' ? '⚔️' : '👹'}</span>
        </div>
        <h3
          data-testid={`${testIdPrefix}-name`}
          className="text-base sm:text-lg font-bold"
        >
          {character.name}
        </h3>
      </div>

      {/* HP 바 */}
      <div className="mb-2">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-red-400">HP</span>
          <span>
            {character.currentHp} / {character.baseStats.hp}
          </span>
        </div>
        <div
          role="progressbar"
          aria-label={`${character.name} HP`}
          aria-valuenow={character.currentHp}
          aria-valuemin={0}
          aria-valuemax={character.baseStats.hp}
          className="h-3 bg-gray-700 rounded-full overflow-hidden"
        >
          <div
            className="h-full bg-red-500 transition-all duration-300"
            style={{ width: `${hpPercent}%` }}
          />
        </div>
      </div>

      {/* MP 바 */}
      <div className="mb-3">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-blue-400">MP</span>
          <span>
            {character.currentMp} / {character.baseStats.mp}
          </span>
        </div>
        <div
          role="progressbar"
          aria-label={`${character.name} MP`}
          aria-valuenow={character.currentMp}
          aria-valuemin={0}
          aria-valuemax={character.baseStats.mp}
          className="h-3 bg-gray-700 rounded-full overflow-hidden"
        >
          <div
            className="h-full bg-blue-500 transition-all duration-300"
            style={{ width: `${mpPercent}%` }}
          />
        </div>
      </div>

      {/* 버프/디버프 */}
      {(buffs.length > 0 || debuffs.length > 0) && (
        <div className="flex flex-wrap gap-1">
          {buffs.map((e) => (
            <span
              key={e.id}
              className="text-xs px-2 py-0.5 bg-green-900 text-green-300 rounded"
            >
              {e.targetStat.toUpperCase()} +{e.amount} ({e.remainingTurns}t)
            </span>
          ))}
          {debuffs.map((e) => (
            <span
              key={e.id}
              className="text-xs px-2 py-0.5 bg-red-900 text-red-300 rounded"
            >
              {e.targetStat.toUpperCase()} -{e.amount} ({e.remainingTurns}t)
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
