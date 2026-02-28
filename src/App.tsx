import { useGameStore } from './stores/game-store'
import { SetupPage } from './features/setup/SetupPage'
import { BattlePage } from './features/battle/BattlePage'
import { ResultPage } from './features/result/ResultPage'
import { ErrorBoundary } from './ErrorBoundary'

function App() {
  const phase = useGameStore((s) => s.phase)

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-linear-to-b from-gray-900 via-gray-900 to-gray-950 text-white">
        <div key={phase} className="animate-fade-in">
          {phase === 'setup' && <SetupPage />}
          {phase === 'battle' && <BattlePage />}
          {phase === 'result' && <ResultPage />}
        </div>
      </div>
    </ErrorBoundary>
  )
}

export default App
