import type { Character, BattleAction, SkillType } from '../../types'

const SKILL_BUTTON_STYLE: Record<SkillType, string> = {
  attack: 'bg-red-700 hover:bg-red-600 shadow-md shadow-red-900/40',
  defend: 'bg-blue-700 hover:bg-blue-600 shadow-md shadow-blue-900/40',
  heal:   'bg-green-700 hover:bg-green-600 shadow-md shadow-green-900/40',
  buff:   'bg-yellow-700 hover:bg-yellow-600 shadow-md shadow-yellow-900/40',
  debuff: 'bg-purple-700 hover:bg-purple-600 shadow-md shadow-purple-900/40',
}

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
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-[colors,transform] active:scale-95 ${
              isDisabled
                ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                : `${SKILL_BUTTON_STYLE[skill.type]} text-white`
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
