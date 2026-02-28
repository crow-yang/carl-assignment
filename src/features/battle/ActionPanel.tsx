import type { Character, BattleAction, SkillType } from '../../types'

const SKILL_ICON: Record<SkillType, string> = {
  attack: '⚔️',
  defend: '🛡️',
  heal:   '💚',
  buff:   '⬆️',
  debuff: '⬇️',
}

const SKILL_BUTTON_STYLE: Record<SkillType, string> = {
  attack: 'bg-red-700/90 hover:bg-red-600 border-red-500/30 shadow-md shadow-red-900/30',
  defend: 'bg-blue-700/90 hover:bg-blue-600 border-blue-500/30 shadow-md shadow-blue-900/30',
  heal:   'bg-green-700/90 hover:bg-green-600 border-green-500/30 shadow-md shadow-green-900/30',
  buff:   'bg-yellow-700/90 hover:bg-yellow-600 border-yellow-500/30 shadow-md shadow-yellow-900/30',
  debuff: 'bg-purple-700/90 hover:bg-purple-600 border-purple-500/30 shadow-md shadow-purple-900/30',
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
            className={`px-4 py-2.5 rounded-xl text-sm font-medium border transition-[colors,transform,shadow] active:scale-95 ${
              isDisabled
                ? 'bg-gray-700/80 text-gray-500 border-gray-600/30 cursor-not-allowed'
                : `${SKILL_BUTTON_STYLE[skill.type]} text-white hover:shadow-lg`
            }`}
          >
            <span className="inline-flex items-center gap-1.5">
              <span aria-hidden="true" className="text-base">{SKILL_ICON[skill.type]}</span>
              <span>{skill.name}</span>
            </span>
            {skill.mpCost > 0 && (
              <span className={`ml-1.5 text-xs ${canUse ? 'text-blue-300' : 'text-red-400'}`}>
                MP {skill.mpCost}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
