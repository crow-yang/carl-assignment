import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CharacterPanel } from './CharacterPanel'
import type { Character } from '../../types'

function makeCharacter(overrides: Partial<Character> = {}): Character {
  return {
    name: '용사',
    baseStats: { hp: 100, mp: 50, atk: 15, def: 10, spd: 10 },
    currentHp: 75,
    currentMp: 30,
    skills: [],
    activeEffects: [],
    ...overrides,
  }
}

describe('CharacterPanel', () => {
  it('플레이어 패널: data-testid와 이름이 올바르게 렌더링된다', () => {
    render(<CharacterPanel character={makeCharacter()} side="player" />)

    expect(screen.getByTestId('player-panel')).toBeInTheDocument()
    expect(screen.getByTestId('player-name')).toHaveTextContent('용사')
  })

  it('적 패널: data-testid와 이름이 올바르게 렌더링된다', () => {
    render(<CharacterPanel character={makeCharacter({ name: '슬라임' })} side="enemy" />)

    expect(screen.getByTestId('enemy-panel')).toBeInTheDocument()
    expect(screen.getByTestId('enemy-name')).toHaveTextContent('슬라임')
  })

  it('HP/MP 수치가 올바르게 표시된다', () => {
    render(<CharacterPanel character={makeCharacter()} side="player" />)

    expect(screen.getByText('75 / 100')).toBeInTheDocument()
    expect(screen.getByText('30 / 50')).toBeInTheDocument()
  })

  it('HP 프로그레스바에 올바른 aria 속성이 있다', () => {
    render(<CharacterPanel character={makeCharacter()} side="player" />)

    const hpBar = screen.getByRole('progressbar', { name: '용사 HP' })
    expect(hpBar).toHaveAttribute('aria-valuenow', '75')
    expect(hpBar).toHaveAttribute('aria-valuemin', '0')
    expect(hpBar).toHaveAttribute('aria-valuemax', '100')
  })

  it('버프/디버프가 표시된다', () => {
    const character = makeCharacter({
      activeEffects: [
        { id: 'e1', type: 'buff', targetStat: 'atk', amount: 5, remainingTurns: 2, sourceName: '기합' },
        { id: 'e2', type: 'debuff', targetStat: 'def', amount: 3, remainingTurns: 1, sourceName: '약화' },
      ],
    })
    render(<CharacterPanel character={character} side="player" />)

    expect(screen.getByText('ATK +5 (2t)')).toBeInTheDocument()
    expect(screen.getByText('DEF -3 (1t)')).toBeInTheDocument()
  })

  it('효과가 없을 때 버프/디버프 영역이 렌더링되지 않는다', () => {
    const { container } = render(<CharacterPanel character={makeCharacter()} side="player" />)
    // 버프/디버프 텍스트가 없어야 함
    expect(container.querySelector('.flex.flex-wrap.gap-1')).toBeNull()
  })
})
