import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ActionPanel } from './ActionPanel'
import type { Character, AttackSkill, DefendSkill, HealSkill } from '../../types'

const defaultAttack: AttackSkill = {
  id: 'default-attack', name: '공격', type: 'attack', mpCost: 0, multiplier: 1.0, isDefault: true,
}
const defaultDefend: DefendSkill = {
  id: 'default-defend', name: '방어', type: 'defend', mpCost: 0, isDefault: true,
}
const healSkill: HealSkill = {
  id: 'custom-heal', name: '치유', type: 'heal', mpCost: 15, healAmount: 20, isDefault: false,
}

function makePlayer(overrides: Partial<Character> = {}): Character {
  return {
    name: '플레이어',
    baseStats: { hp: 100, mp: 50, atk: 15, def: 10, spd: 10 },
    currentHp: 100,
    currentMp: 50,
    skills: [defaultAttack, defaultDefend, healSkill],
    activeEffects: [],
    ...overrides,
  }
}

describe('ActionPanel', () => {
  it('스킬 버튼이 data-testid 순서대로 렌더링된다', () => {
    render(<ActionPanel player={makePlayer()} onAction={() => {}} disabled={false} />)

    expect(screen.getByTestId('skill-button-0')).toHaveTextContent('공격')
    expect(screen.getByTestId('skill-button-1')).toHaveTextContent('방어')
    expect(screen.getByTestId('skill-button-2')).toHaveTextContent('치유')
  })

  it('MP 부족 시 스킬 버튼이 비활성화된다', () => {
    const player = makePlayer({ currentMp: 10 }) // heal은 MP 15 필요
    render(<ActionPanel player={player} onAction={() => {}} disabled={false} />)

    expect(screen.getByTestId('skill-button-0')).not.toBeDisabled() // 공격 (MP 0)
    expect(screen.getByTestId('skill-button-1')).not.toBeDisabled() // 방어 (MP 0)
    expect(screen.getByTestId('skill-button-2')).toBeDisabled()     // 치유 (MP 15 > 10)
  })

  it('disabled prop이 true면 모든 버튼이 비활성화된다', () => {
    render(<ActionPanel player={makePlayer()} onAction={() => {}} disabled={true} />)

    expect(screen.getByTestId('skill-button-0')).toBeDisabled()
    expect(screen.getByTestId('skill-button-1')).toBeDisabled()
    expect(screen.getByTestId('skill-button-2')).toBeDisabled()
  })

  it('스킬 버튼 클릭 시 올바른 BattleAction이 전달된다', () => {
    const onAction = vi.fn()
    render(<ActionPanel player={makePlayer()} onAction={onAction} disabled={false} />)

    fireEvent.click(screen.getByTestId('skill-button-0'))
    expect(onAction).toHaveBeenCalledWith({ type: 'attack' })

    fireEvent.click(screen.getByTestId('skill-button-1'))
    expect(onAction).toHaveBeenCalledWith({ type: 'defend' })

    fireEvent.click(screen.getByTestId('skill-button-2'))
    expect(onAction).toHaveBeenCalledWith({ type: 'skill', skillId: 'custom-heal' })
  })

  it('mpCost > 0인 스킬에 MP 표시가 렌더링된다', () => {
    render(<ActionPanel player={makePlayer()} onAction={() => {}} disabled={false} />)

    // 공격 (mpCost 0) — MP 표시 없음
    expect(screen.getByTestId('skill-button-0')).not.toHaveTextContent('MP')
    // 치유 (mpCost 15) — MP 표시 있음
    expect(screen.getByTestId('skill-button-2')).toHaveTextContent('MP 15')
  })
})
