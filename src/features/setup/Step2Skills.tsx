import { useState } from 'react'
import { useSetupStore } from '../../stores/setup-store'
import { DEFAULT_SKILLS, MAX_CUSTOM_SKILLS } from '../../constants'
import { SkillForm } from './SkillForm'
import type { Skill, SkillType } from '../../types'

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

const TYPE_LABELS: Record<SkillType, string> = {
  attack: '공격',
  defend: '방어',
  heal: '회복',
  buff: '버프',
  debuff: '디버프',
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
        <h3 className="text-lg font-semibold mb-3">기본 스킬</h3>
        <div className="space-y-2">
          {DEFAULT_SKILLS.map((skill) => (
            <div
              key={skill.id}
              className="flex items-center justify-between p-3 bg-gray-800 rounded-lg border border-gray-700"
            >
              <div>
                <span className="font-medium">{skill.name}</span>
                <span className="ml-2 text-xs px-2 py-0.5 bg-gray-700 rounded text-gray-400">
                  {TYPE_LABELS[skill.type]}
                </span>
              </div>
              <span className="text-sm text-gray-400">{getSkillDescription(skill)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 커스텀 스킬 */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold">
            커스텀 스킬 ({customSkills.length}/{MAX_CUSTOM_SKILLS})
          </h3>
          {canAddMore && !showForm && (
            <button
              data-testid="add-skill-button"
              onClick={() => setShowForm(true)}
              className="px-4 py-1.5 bg-blue-600 text-white text-sm rounded font-medium hover:bg-blue-500 transition-colors"
            >
              스킬 추가
            </button>
          )}
        </div>

        {/* 커스텀 스킬 목록 */}
        {customSkills.length > 0 && (
          <div className="space-y-2 mb-4">
            {customSkills.map((skill) => (
              <div
                key={skill.id}
                className="flex items-center justify-between p-3 bg-gray-800 rounded-lg border border-blue-900"
              >
                <div>
                  <span className="font-medium">{skill.name}</span>
                  <span className="ml-2 text-xs px-2 py-0.5 bg-blue-900 rounded text-blue-300">
                    {TYPE_LABELS[skill.type]}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-400">{getSkillDescription(skill)}</span>
                  <button
                    data-testid="remove-skill-button"
                    onClick={() => removeCustomSkill(skill.id)}
                    className="text-red-400 hover:text-red-300 text-sm transition-colors"
                  >
                    삭제
                  </button>
                </div>
              </div>
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
          <p className="text-sm text-gray-500">커스텀 스킬이 없습니다. 스킬을 추가해보세요.</p>
        )}
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
          data-testid="next-button"
          onClick={nextStep}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-500 transition-colors"
        >
          다음
        </button>
      </div>
    </div>
  )
}
