import { useRef, useEffect } from 'react'
import { SKILL_TYPE_LABELS } from '../../constants'
import type { TurnLogEntry, SkillType } from '../../types'

const SKILL_TYPE_STYLE: Record<SkillType, string> = {
  attack: 'bg-red-900/60 text-red-300',
  defend: 'bg-blue-900/60 text-blue-300',
  heal:   'bg-green-900/60 text-green-300',
  buff:   'bg-yellow-900/60 text-yellow-300',
  debuff: 'bg-purple-900/60 text-purple-300',
}

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
      className="h-32 sm:h-48 overflow-y-auto p-3 bg-gray-800/80 rounded-xl border border-gray-700/50 space-y-1"
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
            <span className="text-gray-500 text-xs mr-1.5">R{entry.round}</span>
            <span className={`text-[10px] px-1.5 rounded mr-1.5 ${SKILL_TYPE_STYLE[entry.skillType]}`}>
              {SKILL_TYPE_LABELS[entry.skillType]}
            </span>
            {entry.action}
          </div>
        ))
      )}
    </div>
  )
}
