import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BattleLog } from './BattleLog'
import type { TurnLogEntry } from '../../types'

function makeLog(entries: Partial<TurnLogEntry>[]): TurnLogEntry[] {
  return entries.map((e, i) => ({
    id: `log-${i}`,
    round: 1,
    actor: 'player' as const,
    actorName: '플레이어',
    skillType: 'attack' as const,
    action: `행동 ${i}`,
    ...e,
  }))
}

describe('BattleLog', () => {
  it('빈 로그: 안내 메시지가 표시된다', () => {
    render(<BattleLog log={[]} />)

    expect(screen.getByTestId('battle-log')).toBeInTheDocument()
    expect(screen.getByText('전투를 시작하세요...')).toBeInTheDocument()
  })

  it('로그 엔트리가 action 텍스트로 렌더링된다', () => {
    const log = makeLog([
      { action: '용사의 기본 공격! 적에게 15 데미지' },
      { actor: 'enemy', actorName: '적', action: '적의 기본 공격! 용사에게 8 데미지' },
    ])
    render(<BattleLog log={log} />)

    expect(screen.getByText(/용사의 기본 공격/)).toBeInTheDocument()
    expect(screen.getByText(/적의 기본 공격/)).toBeInTheDocument()
  })

  it('role="log"과 aria-live="polite" 속성이 있다', () => {
    render(<BattleLog log={[]} />)

    const logEl = screen.getByTestId('battle-log')
    expect(logEl).toHaveAttribute('role', 'log')
    expect(logEl).toHaveAttribute('aria-live', 'polite')
  })
})
