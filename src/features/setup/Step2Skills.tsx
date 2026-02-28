import { useState } from 'react'
import { useSetupStore } from '../../stores/setup-store'
import { DEFAULT_SKILLS, MAX_CUSTOM_SKILLS, SKILL_TYPE_LABELS } from '../../constants'
import { SkillForm } from './SkillForm'
import type { Skill, SkillType } from '../../types'

const SKILL_ICON: Record<SkillType, string> = {
  attack: '⚔️',
  defend: '🛡️',
  heal:   '💚',
  buff:   '⬆️',
  debuff: '⬇️',
}

const SKILL_BORDER: Record<SkillType, string> = {
  attack: 'border-l-red-500',
  defend: 'border-l-blue-500',
  heal:   'border-l-green-500',
  buff:   'border-l-yellow-500',
  debuff: 'border-l-purple-500',
}

const SKILL_BADGE: Record<SkillType, string> = {
  attack: 'bg-red-900/60 text-red-300',
  defend: 'bg-blue-900/60 text-blue-300',
  heal:   'bg-green-900/60 text-green-300',
  buff:   'bg-yellow-900/60 text-yellow-300',
  debuff: 'bg-purple-900/60 text-purple-300',
}

function getSkillDescription(skill: Skill): string {
  switch (skill.type) {
    case 'attack':
      return skill.isDefault
        ? `ATK x${skill.multiplier} 데미지`
        : `ATK x${skill.multiplier} 데미지 (MP ${skill.mpCost})`
    case 'defend':
      return '피해 50% 감소'
    case 'heal':
      return `HP ${skill.healAmount} 회복 (MP ${skill.mpCost})`
    case 'buff':
      return `${skill.targetStat.toUpperCase()} +${skill.amount} ${skill.duration}턴 (MP ${skill.mpCost})`
    case 'debuff':
      return `상대 ${skill.targetStat.toUpperCase()} -${skill.amount} ${skill.duration}턴 (MP ${skill.mpCost})`
  }
}

function SkillCard({ skill, isCustom, onRemove }: {
  skill: Skill
  isCustom?: boolean
  onRemove?: () => void
}) {
  return (
    <div className={`flex items-center justify-between p-3 bg-gray-800/80 rounded-lg border border-l-4 ${SKILL_BORDER[skill.type]} ${
      isCustom ? 'border-t-blue-900/40 border-r-blue-900/40 border-b-blue-900/40' : 'border-t-gray-700/60 border-r-gray-700/60 border-b-gray-700/60'
    }`}>
      <div className="flex items-center gap-2">
        <span aria-hidden="true" className="text-lg">{SKILL_ICON[skill.type]}</span>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-medium">{skill.name}</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${SKILL_BADGE[skill.type]}`}>
              {SKILL_TYPE_LABELS[skill.type]}
            </span>
          </div>
          <span className="text-xs text-gray-400">{getSkillDescription(skill)}</span>
        </div>
      </div>
      {onRemove && (
        <button
          data-testid="remove-skill-button"
          onClick={onRemove}
          className="text-red-400 hover:text-red-300 text-sm px-2 py-1 rounded hover:bg-red-900/30 transition-colors"
        >
          삭제
        </button>
      )}
    </div>
  )
}

export function Step2Skills() {
  const customSkills = useSetupStore((s) => s.customSkills)
  const addCustomSkill = useSetupStore((s) => s.addCustomSkill)
  const removeCustomSkill = useSetupStore((s) => s.removeCustomSkill)
  const nextStep = useSetupStore((s) => s.nextStep)
  const prevStep = useSetupStore((s) => s.prevStep)

  const [showForm, setShowForm] = useState(false)

  const canAddMore = customSkills.length < MAX_CUSTOM_SKILLS

  return (
    <div className="space-y-6">
      {/* 기본 스킬 */}
      <div>
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">기본 스킬</h3>
        <div className="space-y-2">
          {DEFAULT_SKILLS.map((skill) => (
            <SkillCard key={skill.id} skill={skill} />
          ))}
        </div>
      </div>

      {/* 커스텀 스킬 */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
            커스텀 스킬 ({customSkills.length}/{MAX_CUSTOM_SKILLS})
          </h3>
          {canAddMore && !showForm && (
            <button
              data-testid="add-skill-button"
              onClick={() => setShowForm(true)}
              className="px-4 py-1.5 bg-blue-600 text-white text-sm rounded-lg font-medium hover:bg-blue-500 transition-colors"
            >
              + 스킬 추가
            </button>
          )}
        </div>

        {/* 커스텀 스킬 목록 */}
        {customSkills.length > 0 && (
          <div className="space-y-2 mb-4">
            {customSkills.map((skill) => (
              <SkillCard
                key={skill.id}
                skill={skill}
                isCustom
                onRemove={() => removeCustomSkill(skill.id)}
              />
            ))}
          </div>
        )}

        {/* 스킬 생성 폼 */}
        {showForm && (
          <SkillForm
            onSubmit={(data) => {
              addCustomSkill(data)
              setShowForm(false)
            }}
            onCancel={() => setShowForm(false)}
          />
        )}

        {customSkills.length === 0 && !showForm && (
          <div className="py-6 text-center text-sm text-gray-500 border border-dashed border-gray-700 rounded-lg">
            커스텀 스킬이 없습니다. 스킬을 추가해보세요.
          </div>
        )}
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
          data-testid="next-button"
          onClick={nextStep}
          className="px-6 py-2 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-500 transition-colors"
        >
          다음
        </button>
      </div>
    </div>
  )
}
