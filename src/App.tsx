import { useGameStore } from './stores/game-store'
import { SetupPage } from './features/setup/SetupPage'
import { BattlePage } from './features/battle/BattlePage'
import { ResultPage } from './features/result/ResultPage'

function App() {
  const phase = useGameStore((s) => s.phase)

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {phase === 'setup' && <SetupPage />}
      {phase === 'battle' && <BattlePage />}
      {phase === 'result' && <ResultPage />}
    </div>
  )
}

export default App
