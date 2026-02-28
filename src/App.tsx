import { useEffect, useRef } from 'react'
import { useGameStore } from './stores/game-store'
import { SetupPage } from './features/setup/SetupPage'
import { BattlePage } from './features/battle/BattlePage'
import { ResultPage } from './features/result/ResultPage'
import { ErrorBoundary } from './ErrorBoundary'

function App() {
  const phase = useGameStore((s) => s.phase)
  const phaseRef = useRef<HTMLDivElement>(null)

  // 페이즈 전환 시 포커스를 컨테이너로 이동 (접근성: 스크린 리더/키보드 사용자 안내)
  useEffect(() => {
    phaseRef.current?.focus()
  }, [phase])

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-linear-to-b from-gray-900 via-gray-900 to-gray-950 text-white">
        <div key={phase} ref={phaseRef} tabIndex={-1} className="animate-fade-in outline-none">
          {phase === 'setup' && <SetupPage />}
          {phase === 'battle' && <BattlePage />}
          {phase === 'result' && <ResultPage />}
        </div>
      </div>
    </ErrorBoundary>
  )
}

export default App
