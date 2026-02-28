import { useSetupStore, selectRemainingPoints } from '../../stores/setup-store'
import { STAT_KEYS, STAT_RANGES, STAT_LABELS, TOTAL_STAT_POINTS } from '../../constants'
import { validateName } from '../../lib/validation'

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
          className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
        />
        {name.length > 0 && !nameValidation.valid && (
          <p className="mt-1 text-sm text-red-400">{nameValidation.errors[0]}</p>
        )}
      </div>

      {/* 스탯 배분 */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">스탯 배분</h3>
          <div className="text-sm">
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
          </div>
        </div>

        <div className="space-y-3">
          {STAT_KEYS.map((stat) => {
            const range = STAT_RANGES[stat]
            return (
              <div key={stat} className="flex items-center gap-4">
                <label className="w-12 text-sm font-medium text-gray-300">
                  {STAT_LABELS[stat]}
                </label>
                <input
                  type="range"
                  aria-label={`${STAT_LABELS[stat]} 슬라이더`}
                  min={range.min}
                  max={range.max}
                  value={stats[stat]}
                  onChange={(e) => setStat(stat, Number(e.target.value))}
                  className="flex-1 accent-blue-500"
                />
                <input
                  data-testid={`stat-${stat}`}
                  type="number"
                  aria-label={`${STAT_LABELS[stat]} 수치 입력`}
                  min={range.min}
                  max={range.max}
                  value={stats[stat]}
                  onChange={(e) => setStat(stat, Number(e.target.value))}
                  className="w-16 px-2 py-1 bg-gray-800 border border-gray-600 rounded text-center text-white focus:outline-none focus:border-blue-500"
                />
                <span className="w-16 text-xs text-gray-500 text-right">
                  {range.min}~{range.max}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* 다음 버튼 */}
      <div className="flex justify-end">
        <button
          data-testid="next-button"
          onClick={nextStep}
          disabled={!canProceed}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-500 disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors"
        >
          다음
        </button>
      </div>
    </div>
  )
}
