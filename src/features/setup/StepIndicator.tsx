const STEP_LABELS = ['이름 & 스탯', '스킬', '난이도'] as const

interface StepIndicatorProps {
  currentStep: 1 | 2 | 3
}

export function StepIndicator({ currentStep }: StepIndicatorProps) {
  return (
    <nav aria-label="설정 단계" className="flex items-center justify-center gap-2 mb-8">
      <ol className="flex items-center gap-2" role="list">
        {STEP_LABELS.map((label, i) => {
          const step = (i + 1) as 1 | 2 | 3
          const isActive = step === currentStep
          const isDone = step < currentStep

          return (
            <li
              key={step}
              className="flex items-center gap-2"
              aria-current={isActive ? 'step' : undefined}
            >
              {i > 0 && (
                <div
                  aria-hidden="true"
                  className={`w-8 h-0.5 ${
                    isDone ? 'bg-blue-500' : 'bg-gray-600'
                  }`}
                />
              )}
              <div className="flex flex-col items-center gap-1">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                    isActive
                      ? 'bg-blue-500 text-white'
                      : isDone
                        ? 'bg-blue-500/30 text-blue-300'
                        : 'bg-gray-700 text-gray-400'
                  }`}
                >
                  {step}
                </div>
                <span
                  className={`text-xs ${
                    isActive ? 'text-white' : 'text-gray-500'
                  }`}
                >
                  {label}
                </span>
              </div>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
