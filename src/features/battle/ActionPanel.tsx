import type { Character, BattleAction } from '../../types'

interface ActionPanelProps {
  player: Character
  onAction: (action: BattleAction) => void
  disabled: boolean
}

export function ActionPanel({ player, onAction, disabled }: ActionPanelProps) {
  return (
    <div className="flex flex-wrap gap-2 justify-center">
      {player.skills.map((skill, index) => {
        const canUse = player.currentMp >= skill.mpCost
        const isDisabled = disabled || !canUse

        const action: BattleAction =
          skill.type === 'attack' && skill.isDefault
            ? { type: 'attack' }
            : skill.type === 'defend'
              ? { type: 'defend' }
              : { type: 'skill', skillId: skill.id }

        return (
          <button
            key={skill.id}
            data-testid={`skill-button-${index}`}
            onClick={() => onAction(action)}
            disabled={isDisabled}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              isDisabled
                ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                : 'bg-gray-700 text-white hover:bg-gray-600'
            }`}
          >
            <span>{skill.name}</span>
            {skill.mpCost > 0 && (
              <span className={`ml-1 text-xs ${canUse ? 'text-blue-400' : 'text-red-400'}`}>
                MP {skill.mpCost}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
