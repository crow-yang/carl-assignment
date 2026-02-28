import { useState } from 'react'
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

const SKILL_TYPE_LABELS: Record<CustomSkillType, string> = {
  attack: '공격',
  heal: '회복',
  buff: '버프',
  debuff: '디버프',
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

  const isNameValid = name.length >= 1 && name.length <= 8
  const isMpValid = mpCost >= 1 && mpCost <= 30

  let isTypeFieldsValid = true
  if (type === 'attack') isTypeFieldsValid = multiplier >= 1.0 && multiplier <= 3.0
  if (type === 'heal') isTypeFieldsValid = healAmount >= 10 && healAmount <= 50
  if (type === 'buff' || type === 'debuff') {
    isTypeFieldsValid = amount >= 1 && amount <= 10 && duration >= 1 && duration <= 5
  }

  const canSubmit = isNameValid && isMpValid && isTypeFieldsValid

  const handleSubmit = () => {
    if (!canSubmit) return
    const base = { name, type, mpCost }
    switch (type) {
      case 'attack':
        onSubmit({ ...base, multiplier })
        break
      case 'heal':
        onSubmit({ ...base, healAmount })
        break
      case 'buff':
      case 'debuff':
        onSubmit({ ...base, targetStat, amount, duration })
        break
    }
  }

  return (
    <div className="p-4 bg-gray-800 rounded-lg border border-gray-600 space-y-4">
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
          {(Object.keys(SKILL_TYPE_LABELS) as CustomSkillType[]).map((t) => (
            <button
              key={t}
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
      <div>
        <label className="block text-xs text-gray-400 mb-1">MP 소모 (1~30)</label>
        <input
          type="number"
          min={1}
          max={30}
          value={mpCost}
          onChange={(e) => setMpCost(Number(e.target.value))}
          className="w-24 px-3 py-1.5 bg-gray-900 border border-gray-600 rounded text-white text-sm focus:outline-none focus:border-blue-500"
        />
      </div>

      {/* 타입별 추가 필드 */}
      {type === 'attack' && (
        <div>
          <label className="block text-xs text-gray-400 mb-1">배율 (1.0~3.0)</label>
          <input
            type="number"
            min={1.0}
            max={3.0}
            step={0.1}
            value={multiplier}
            onChange={(e) => setMultiplier(Number(e.target.value))}
            className="w-24 px-3 py-1.5 bg-gray-900 border border-gray-600 rounded text-white text-sm focus:outline-none focus:border-blue-500"
          />
        </div>
      )}

      {type === 'heal' && (
        <div>
          <label className="block text-xs text-gray-400 mb-1">회복량 (10~50)</label>
          <input
            type="number"
            min={10}
            max={50}
            value={healAmount}
            onChange={(e) => setHealAmount(Number(e.target.value))}
            className="w-24 px-3 py-1.5 bg-gray-900 border border-gray-600 rounded text-white text-sm focus:outline-none focus:border-blue-500"
          />
        </div>
      )}

      {(type === 'buff' || type === 'debuff') && (
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-gray-400 mb-1">대상 스탯</label>
            <div className="flex gap-2">
              {(['atk', 'def'] as BuffTargetStat[]).map((s) => (
                <button
                  key={s}
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
            <div>
              <label className="block text-xs text-gray-400 mb-1">수치 (1~10)</label>
              <input
                type="number"
                min={1}
                max={10}
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-20 px-3 py-1.5 bg-gray-900 border border-gray-600 rounded text-white text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">지속 턴 (1~5)</label>
              <input
                type="number"
                min={1}
                max={5}
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="w-20 px-3 py-1.5 bg-gray-900 border border-gray-600 rounded text-white text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* 버튼 */}
      <div className="flex gap-2 pt-2">
        <button
          data-testid="submit-skill-button"
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="px-4 py-1.5 bg-green-600 text-white text-sm rounded font-medium hover:bg-green-500 disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors"
        >
          생성
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-1.5 bg-gray-700 text-gray-300 text-sm rounded hover:bg-gray-600 transition-colors"
        >
          취소
        </button>
      </div>
    </div>
  )
}
