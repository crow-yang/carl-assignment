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
      <div className="min-h-screen bg-linear-to-b from-gray-900 via-gray-900 to-gray-950 text-white relative overflow-hidden">
        {/* 배경 장식 — 미묘한 방사형 그라데이션 */}
        <div aria-hidden="true" className="pointer-events-none fixed inset-0 overflow-hidden">
          <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-500/3 rounded-full blur-3xl animate-glow-pulse" />
          <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-500/3 rounded-full blur-3xl animate-glow-pulse" style={{ animationDelay: '1s' }} />
        </div>
        <div key={phase} ref={phaseRef} tabIndex={-1} className="relative animate-fade-in outline-none">
          {phase === 'setup' && <SetupPage />}
          {phase === 'battle' && <BattlePage />}
          {phase === 'result' && <ResultPage />}
        </div>
      </div>
    </ErrorBoundary>
  )
}

export default App
