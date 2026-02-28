import type { Character } from '../../types'

interface CharacterPanelProps {
  character: Character
  side: 'player' | 'enemy'
}

export function CharacterPanel({ character, side }: CharacterPanelProps) {
  const hpPercent = Math.max(0, (character.currentHp / character.baseStats.hp) * 100)
  const mpPercent = Math.max(0, (character.currentMp / character.baseStats.mp) * 100)

  const testIdPrefix = side === 'player' ? 'player' : 'enemy'
  const buffs = character.activeEffects.filter((e) => e.type === 'buff')
  const debuffs = character.activeEffects.filter((e) => e.type === 'debuff')

  return (
    <div
      data-testid={`${testIdPrefix}-panel`}
      className="p-4 bg-gray-800 rounded-lg border border-gray-700"
    >
      {/* 이름 */}
      <h3
        data-testid={`${testIdPrefix}-name`}
        className="text-base sm:text-lg font-bold mb-3"
      >
        {character.name}
      </h3>

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
