import { useState } from 'react'
import { SKILL_TYPE_LABELS } from '../../constants'
import { validateCustomSkill } from '../../lib/validation'
import type { CustomSkillFormData } from '../../schemas'
import type { CustomSkillType, BuffTargetStat } from '../../types'

interface SkillFormProps {
  onSubmit: (data: {
    name: string
    type: CustomSkillType
    mpCost: number
    multiplier?: number
    healAmount?: number
    targetStat?: BuffTargetStat
    amount?: number
    duration?: number
  }) => void
  onCancel: () => void
}

const CUSTOM_SKILL_TYPES: CustomSkillType[] = ['attack', 'heal', 'buff', 'debuff']

function NumberInput({ label, width = 'w-24', ...props }: {
  label: string
  width?: string
  min: number
  max: number
  step?: number
  value: number
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}) {
  return (
    <div>
      <label className="block text-xs text-gray-400 mb-1">{label}</label>
      <input
        type="number"
        {...props}
        className={`${width} px-3 py-1.5 bg-gray-900 border border-gray-600 rounded text-white text-sm focus:outline-none focus:border-blue-500`}
      />
    </div>
  )
}

export function SkillForm({ onSubmit, onCancel }: SkillFormProps) {
  const [name, setName] = useState('')
  const [type, setType] = useState<CustomSkillType>('attack')
  const [mpCost, setMpCost] = useState(5)
  const [multiplier, setMultiplier] = useState(1.5)
  const [healAmount, setHealAmount] = useState(20)
  const [targetStat, setTargetStat] = useState<BuffTargetStat>('atk')
  const [amount, setAmount] = useState(5)
  const [duration, setDuration] = useState(3)

  const formData: CustomSkillFormData = (() => {
    const base = { name, mpCost }
    switch (type) {
      case 'attack': return { ...base, type, multiplier }
      case 'heal': return { ...base, type, healAmount }
      case 'buff':
      case 'debuff': return { ...base, type, targetStat, amount, duration }
    }
  })()
  const validation = validateCustomSkill(formData)
  const canSubmit = validation.valid

  const handleSubmit = () => {
    if (!canSubmit) return
    onSubmit(formData)
  }

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); handleSubmit() }}
      className="p-4 bg-gray-800 rounded-lg border border-gray-600 space-y-4"
    >
      <h4 className="text-sm font-semibold text-gray-300">커스텀 스킬 생성</h4>

      {/* 스킬 이름 */}
      <div>
        <label className="block text-xs text-gray-400 mb-1">스킬 이름 (1~8자)</label>
        <input
          data-testid="skill-name-input"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={8}
          placeholder="스킬 이름"
          className="w-full px-3 py-1.5 bg-gray-900 border border-gray-600 rounded text-white text-sm focus:outline-none focus:border-blue-500"
        />
      </div>

      {/* 스킬 타입 */}
      <div>
        <label className="block text-xs text-gray-400 mb-1">타입</label>
        <div className="flex gap-2">
          {CUSTOM_SKILL_TYPES.map((t) => (
            <button
              key={t}
              type="button"
              aria-pressed={type === t}
              onClick={() => setType(t)}
              className={`px-3 py-1 text-xs rounded transition-colors ${
                type === t
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
              }`}
            >
              {SKILL_TYPE_LABELS[t]}
            </button>
          ))}
        </div>
      </div>

      {/* MP 소모 */}
      <NumberInput label="MP 소모 (1~30)" min={1} max={30} value={mpCost} onChange={(e) => setMpCost(Number(e.target.value))} />

      {/* 타입별 추가 필드 */}
      {type === 'attack' && (
        <NumberInput label="배율 (1.0~3.0)" min={1.0} max={3.0} step={0.1} value={multiplier} onChange={(e) => setMultiplier(Number(e.target.value))} />
      )}

      {type === 'heal' && (
        <NumberInput label="회복량 (10~50)" min={10} max={50} value={healAmount} onChange={(e) => setHealAmount(Number(e.target.value))} />
      )}

      {(type === 'buff' || type === 'debuff') && (
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-gray-400 mb-1">대상 스탯</label>
            <div className="flex gap-2">
              {(['atk', 'def'] as BuffTargetStat[]).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setTargetStat(s)}
                  className={`px-3 py-1 text-xs rounded transition-colors ${
                    targetStat === s
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                  }`}
                >
                  {s.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-4">
            <NumberInput label="수치 (1~10)" min={1} max={10} value={amount} onChange={(e) => setAmount(Number(e.target.value))} width="w-20" />
            <NumberInput label="지속 턴 (1~5)" min={1} max={5} value={duration} onChange={(e) => setDuration(Number(e.target.value))} width="w-20" />
          </div>
        </div>
      )}

      {/* 버튼 */}
      <div className="flex gap-2 pt-2">
        <button
          data-testid="submit-skill-button"
          type="submit"
          disabled={!canSubmit}
          className="px-4 py-1.5 bg-green-600 text-white text-sm rounded font-medium hover:bg-green-500 disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors"
        >
          생성
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-1.5 bg-gray-700 text-gray-300 text-sm rounded hover:bg-gray-600 transition-colors"
        >
          취소
        </button>
      </div>

      {/* 검증 에러 메시지 */}
      {!validation.valid && name.length > 0 && (
        <p className="text-sm text-red-400">{validation.errors[0]}</p>
      )}
    </form>
  )
}
