import { useRef, useEffect } from 'react'
import type { TurnLogEntry } from '../../types'

interface BattleLogProps {
  log: TurnLogEntry[]
}

export function BattleLog({ log }: BattleLogProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  // 새 로그 추가 시 스크롤
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight
    }
  }, [log.length])

  return (
    <div
      data-testid="battle-log"
      ref={containerRef}
      role="log"
      aria-live="polite"
      className="h-32 sm:h-48 overflow-y-auto p-3 bg-gray-800 rounded-lg border border-gray-700 space-y-1"
    >
      {log.length === 0 ? (
        <p className="text-sm text-gray-500">전투를 시작하세요...</p>
      ) : (
        log.map((entry, i) => (
          <div
            key={i}
            className={`text-sm animate-slide-up ${
              entry.actor === 'player' ? 'text-blue-300' : 'text-red-300'
            }`}
          >
            <span className="text-gray-500 text-xs mr-2">R{entry.round}</span>
            {entry.action}
          </div>
        ))
      )}
    </div>
  )
}
