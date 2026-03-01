import { useReducer, useState } from 'react'
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

// ─── 폼 상태 ────────────────────────────────────────────────

interface SkillFormState {
  name: string
  type: CustomSkillType
  mpCost: number
  multiplier: number
  healAmount: number
  targetStat: BuffTargetStat
  amount: number
  duration: number
}

type SkillFormAction =
  | { field: 'name'; value: string }
  | { field: 'type'; value: CustomSkillType }
  | { field: 'mpCost' | 'multiplier' | 'healAmount' | 'amount' | 'duration'; value: number }
  | { field: 'targetStat'; value: BuffTargetStat }

const initialFormState: SkillFormState = {
  name: '',
  type: 'attack',
  mpCost: 5,
  multiplier: 1.5,
  healAmount: 20,
  targetStat: 'atk',
  amount: 5,
  duration: 3,
}

function formReducer(state: SkillFormState, action: SkillFormAction): SkillFormState {
  return { ...state, [action.field]: action.value }
}

function NumberInput({ label, width = 'w-24', onSafeChange, ...props }: {
  label: string
  width?: string
  min: number
  max: number
  step?: number
  value: number
  onSafeChange: (value: number) => void
}) {
  const [display, setDisplay] = useState(String(props.value))
  const [prevValue, setPrevValue] = useState(props.value)

  if (prevValue !== props.value) {
    setPrevValue(props.value)
    setDisplay(String(props.value))
  }

  return (
    <div>
      <label className="block text-xs text-gray-400 mb-1">{label}</label>
      <input
        type="number"
        min={props.min}
        max={props.max}
        step={props.step}
        value={display}
        onChange={(e) => {
          const raw = e.target.value
          const parsed = Number(raw)
          if (raw === '' || Number.isNaN(parsed)) {
            setDisplay(raw)
            return
          }
          // max 초과 시 max로 캡
          if (parsed > props.max) {
            setDisplay(String(props.max))
            onSafeChange(props.max)
            return
          }
          setDisplay(raw)
          onSafeChange(parsed)
        }}
        onBlur={() => {
          // blur 시 min~max 범위로 클램핑
          const parsed = Number(display)
          if (display === '' || Number.isNaN(parsed)) {
            onSafeChange(props.min)
            setDisplay(String(props.min))
            return
          }
          const clamped = Math.max(props.min, Math.min(props.max, parsed))
          if (clamped !== props.value) {
            onSafeChange(clamped)
          }
          setDisplay(String(clamped))
        }}
        className={`${width} px-3 py-1.5 bg-gray-900 border border-gray-600 rounded text-white text-sm focus:outline-none focus:border-blue-500`}
      />
    </div>
  )
}

// ─── 메인 컴포넌트 ───────────────────────────────────────────

export function SkillForm({ onSubmit, onCancel }: SkillFormProps) {
  const [form, dispatch] = useReducer(formReducer, initialFormState)

  const formData: CustomSkillFormData = (() => {
    const base = { name: form.name, mpCost: form.mpCost }
    switch (form.type) {
      case 'attack': return { ...base, type: form.type, multiplier: form.multiplier }
      case 'heal': return { ...base, type: form.type, healAmount: form.healAmount }
      case 'buff':
      case 'debuff': return { ...base, type: form.type, targetStat: form.targetStat, amount: form.amount, duration: form.duration }
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
          value={form.name}
          onChange={(e) => dispatch({ field: 'name', value: e.target.value })}
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
              aria-pressed={form.type === t}
              onClick={() => dispatch({ field: 'type', value: t })}
              className={`px-3 py-1 text-xs rounded transition-colors ${
                form.type === t
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
      <NumberInput label="MP 소모 (1~30)" min={1} max={30} value={form.mpCost} onSafeChange={(v) => dispatch({ field: 'mpCost', value: v })} />

      {/* 타입별 추가 필드 */}
      {form.type === 'attack' && (
        <NumberInput label="배율 (1.0~3.0)" min={1.0} max={3.0} step={0.1} value={form.multiplier} onSafeChange={(v) => dispatch({ field: 'multiplier', value: v })} />
      )}

      {form.type === 'heal' && (
        <NumberInput label="회복량 (10~50)" min={10} max={50} value={form.healAmount} onSafeChange={(v) => dispatch({ field: 'healAmount', value: v })} />
      )}

      {(form.type === 'buff' || form.type === 'debuff') && (
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-gray-400 mb-1">대상 스탯</label>
            <div className="flex gap-2">
              {(['atk', 'def'] as BuffTargetStat[]).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => dispatch({ field: 'targetStat', value: s })}
                  className={`px-3 py-1 text-xs rounded transition-colors ${
                    form.targetStat === s
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
            <NumberInput label="수치 (1~10)" min={1} max={10} value={form.amount} onSafeChange={(v) => dispatch({ field: 'amount', value: v })} width="w-20" />
            <NumberInput label="지속 턴 (1~5)" min={1} max={5} value={form.duration} onSafeChange={(v) => dispatch({ field: 'duration', value: v })} width="w-20" />
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

      {/* 검증 에러 메시지 — 이름 미입력 시에도 수치 관련 에러는 표시 */}
      {!validation.valid && (() => {
        const errors = form.name.length > 0
          ? validation.errors
          : validation.errors.filter((e) => !e.includes('이름'))
        return errors.length > 0 ? <p className="text-sm text-red-400">{errors[0]}</p> : null
      })()}
    </form>
  )
}
