import { useState } from 'react'
import { useSetupStore, selectRemainingPoints } from '../../stores/setup-store'
import { STAT_KEYS, STAT_RANGES, STAT_LABELS, TOTAL_STAT_POINTS } from '../../constants'
import { validateName } from '../../lib/validation'

/** 로컬 string state로 display를 분리하여 leading zero 방지 */
function StatNumberInput({ testId, ariaLabel, min, max, value, onChange, className }: {
  testId: string
  ariaLabel: string
  min: number
  max: number
  value: number
  onChange: (value: number) => void
  className: string
}) {
  const [display, setDisplay] = useState(String(value))
  const [prevValue, setPrevValue] = useState(value)

  if (prevValue !== value) {
    setPrevValue(value)
    setDisplay(String(value))
  }

  return (
    <input
      data-testid={testId}
      type="number"
      aria-label={ariaLabel}
      min={min}
      max={max}
      value={display}
      onChange={(e) => {
        const raw = e.target.value
        const parsed = Number(raw)
        if (raw === '' || Number.isNaN(parsed)) {
          setDisplay(raw)
          return
        }
        // max 초과 시 max로 캡
        if (parsed > max) {
          setDisplay(String(max))
          onChange(max)
          return
        }
        setDisplay(raw)
        onChange(parsed)
      }}
      onBlur={() => {
        const parsed = Number(display)
        if (display === '' || Number.isNaN(parsed)) {
          setDisplay(String(value))
          return
        }
        if (parsed < min) {
          onChange(min)
          setDisplay(String(min))
          return
        }
        setDisplay(String(value))
      }}
      className={className}
    />
  )
}

export function Step1NameAndStats() {
  const name = useSetupStore((s) => s.name)
  const stats = useSetupStore((s) => s.stats)
  const setName = useSetupStore((s) => s.setName)
  const setStat = useSetupStore((s) => s.setStat)
  const remaining = useSetupStore(selectRemainingPoints)
  const nextStep = useSetupStore((s) => s.nextStep)
  const nameValidation = validateName(name)
  const canProceed = nameValidation.valid && remaining === 0

  return (
    <div className="space-y-6">
      {/* 이름 입력 */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          캐릭터 이름
        </label>
        <input
          data-testid="name-input"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="이름을 입력하세요 (1~10자)"
          maxLength={10}
          className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 transition-colors"
        />
        {name.length > 0 && !nameValidation.valid && (
          <p className="mt-1 text-sm text-red-400">{nameValidation.errors[0]}</p>
        )}
      </div>

      {/* 스탯 배분 */}
      <fieldset className="border-0 p-0 m-0">
        <legend className="flex items-center justify-between mb-4 w-full">
          <span className="text-lg font-semibold">스탯 배분</span>
          <span className="text-sm">
            잔여 포인트:{' '}
            <span
              data-testid="remaining-points"
              className={`font-bold ${
                remaining === 0
                  ? 'text-green-400'
                  : remaining < 0
                    ? 'text-red-400'
                    : 'text-yellow-400'
              }`}
            >
              {remaining}
            </span>
            <span className="text-gray-500"> / {TOTAL_STAT_POINTS}</span>
          </span>
        </legend>

        <div className="space-y-3">
          {STAT_KEYS.map((stat) => {
            const range = STAT_RANGES[stat]
            const statLabel = STAT_LABELS[stat]
            const atMax = stats[stat] >= range.max
            const atCap = remaining === 0 && stats[stat] < range.max
            return (
              <div key={stat} role="group" aria-label={`${statLabel} 배분`} className="flex items-center gap-4">
                <label className="w-12 text-sm font-medium text-gray-300">
                  {statLabel}
                </label>
                <input
                  type="range"
                  aria-label={`${statLabel} 슬라이더`}
                  min={range.min}
                  max={range.max}
                  value={stats[stat]}
                  onChange={(e) => setStat(stat, Number(e.target.value))}
                  className="flex-1 accent-blue-500"
                />
                <StatNumberInput
                  testId={`stat-${stat}`}
                  ariaLabel={`${statLabel} 수치 입력`}
                  min={range.min}
                  max={range.max}
                  value={stats[stat]}
                  onChange={(v) => setStat(stat, v)}
                  className={`w-16 px-2 py-1 bg-gray-800 border rounded text-center text-white focus:outline-none focus:border-blue-500 ${
                    atMax ? 'border-yellow-500/60' : 'border-gray-600'
                  }`}
                />
                <span className={`w-16 text-xs text-right ${
                  atMax ? 'text-yellow-500' : atCap ? 'text-gray-600' : 'text-gray-500'
                }`}>
                  {atMax ? 'MAX' : `${range.min}~${range.max}`}
                </span>
              </div>
            )
          })}
        </div>
      </fieldset>

      {/* 다음 버튼 */}
      <div className="flex justify-end">
        <button
          data-testid="next-button"
          onClick={nextStep}
          disabled={!canProceed}
          className="px-6 py-2 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-500 disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors"
        >
          다음
        </button>
      </div>
    </div>
  )
}
