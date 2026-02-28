import { useSetupStore } from '../../stores/setup-store'
import { StepIndicator } from './StepIndicator'
import { Step1NameAndStats } from './Step1NameAndStats'
import { Step2Skills } from './Step2Skills'
import { Step3Difficulty } from './Step3Difficulty'

export function SetupPage() {
  const currentStep = useSetupStore((s) => s.currentStep)

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div key={currentStep} className="w-full max-w-lg animate-slide-up">
        <h1 className="text-2xl font-black text-center mb-2">
          <span aria-hidden="true">⚔️ </span>캐릭터 세팅
        </h1>
        <StepIndicator currentStep={currentStep} />

        {currentStep === 1 && <Step1NameAndStats />}
        {currentStep === 2 && <Step2Skills />}
        {currentStep === 3 && <Step3Difficulty />}
      </div>
    </div>
  )
}
