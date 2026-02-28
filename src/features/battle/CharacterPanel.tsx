import type { ReactNode } from 'react'
import type { Character } from '../../types'
import type { VisualEffect } from './battle-visual-helpers'

interface CharacterPanelProps {
  character: Character
  side: 'player' | 'enemy'
  activeEffect?: VisualEffect
}

const EFFECT_CLASS: Record<string, string> = {
  'hit-flash': 'animate-hit-flash',
  'pulse-heal': 'animate-pulse-heal',
  'shake': 'animate-shake',
}

// ─── 캐릭터 SVG 아바타 ─────────────────────────────────────
const PLAYER_SVG = (
  <svg viewBox="0 0 40 40" fill="none" className="w-8 h-8">
    <path d="M20 4L24 16H16L20 4Z" fill="#93C5FD" />
    <rect x="18" y="16" width="4" height="14" rx="1" fill="#60A5FA" />
    <rect x="12" y="28" width="16" height="4" rx="2" fill="#3B82F6" />
  </svg>
)

const ENEMY_SVGS: Record<string, ReactNode> = {
  '슬라임': (
    <svg viewBox="0 0 40 40" fill="none" className="w-8 h-8">
      <ellipse cx="20" cy="28" rx="14" ry="10" fill="#4ADE80" />
      <ellipse cx="20" cy="22" rx="12" ry="12" fill="#22C55E" />
      <circle cx="15" cy="20" r="2.5" fill="white" />
      <circle cx="25" cy="20" r="2.5" fill="white" />
      <circle cx="15.5" cy="20.5" r="1.2" fill="#1E293B" />
      <circle cx="25.5" cy="20.5" r="1.2" fill="#1E293B" />
    </svg>
  ),
  '오크 전사': (
    <svg viewBox="0 0 40 40" fill="none" className="w-8 h-8">
      <circle cx="20" cy="18" r="10" fill="#A78BFA" />
      <rect x="14" y="10" width="3" height="6" rx="1" fill="#7C3AED" transform="rotate(-15 14 10)" />
      <rect x="23" y="10" width="3" height="6" rx="1" fill="#7C3AED" transform="rotate(15 23 10)" />
      <circle cx="16" cy="17" r="2" fill="#FDE68A" />
      <circle cx="24" cy="17" r="2" fill="#FDE68A" />
      <path d="M16 23Q20 26 24 23" stroke="#1E293B" strokeWidth="1.5" strokeLinecap="round" />
      <rect x="8" y="28" width="24" height="4" rx="2" fill="#8B5CF6" />
    </svg>
  ),
  '드래곤 나이트': (
    <svg viewBox="0 0 40 40" fill="none" className="w-8 h-8">
      <path d="M20 6L28 14L24 16L20 8L16 16L12 14L20 6Z" fill="#F87171" />
      <path d="M14 16L20 12L26 16L26 28L14 28Z" fill="#991B1B" />
      <rect x="18" y="18" width="4" height="2" rx="1" fill="#FCA5A5" />
      <circle cx="16.5" cy="20" r="1.5" fill="#FBBF24" />
      <circle cx="23.5" cy="20" r="1.5" fill="#FBBF24" />
      <path d="M10 30L14 28L26 28L30 30" stroke="#7F1D1D" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
}

const DEFAULT_ENEMY_SVG = (
  <svg viewBox="0 0 40 40" fill="none" className="w-8 h-8">
    <circle cx="20" cy="20" r="12" fill="#F87171" />
    <circle cx="16" cy="18" r="2" fill="white" />
    <circle cx="24" cy="18" r="2" fill="white" />
    <path d="M15 25Q20 28 25 25" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
)

export function CharacterPanel({ character, side, activeEffect }: CharacterPanelProps) {
  const hpPercent = Math.max(0, (character.currentHp / character.baseStats.hp) * 100)
  const mpPercent = Math.max(0, (character.currentMp / character.baseStats.mp) * 100)

  const testIdPrefix = side === 'player' ? 'player' : 'enemy'
  const buffs = character.activeEffects.filter((e) => e.type === 'buff')
  const debuffs = character.activeEffects.filter((e) => e.type === 'debuff')
  const effectClass = activeEffect ? EFFECT_CLASS[activeEffect] ?? '' : ''

  return (
    <div
      data-testid={`${testIdPrefix}-panel`}
      className={`p-4 bg-gray-800 rounded-xl border-2 shadow-lg ${
        side === 'player' ? 'border-blue-800 shadow-blue-900/20' : 'border-red-800 shadow-red-900/20'
      } ${effectClass}`}
    >
      {/* 캐릭터 아바타 + 이름 */}
      <div className="flex items-center gap-2 mb-3">
        <div className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl ${
          side === 'player'
            ? 'bg-linear-to-br from-blue-600 to-blue-800 ring-2 ring-blue-400'
            : 'bg-linear-to-br from-red-600 to-red-800 ring-2 ring-red-400'
        }`}>
          <span aria-hidden="true">
            {side === 'player' ? PLAYER_SVG : (ENEMY_SVGS[character.name] ?? DEFAULT_ENEMY_SVG)}
          </span>
        </div>
        <h3
          data-testid={`${testIdPrefix}-name`}
          className="text-base sm:text-lg font-bold"
        >
          {character.name}
        </h3>
      </div>

      {/* HP 바 */}
      <div className="mb-2">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-red-400">HP</span>
          <span>
            {character.currentHp} / {character.baseStats.hp}
          </span>
        </div>
        <div
          role="progressbar"
          aria-label={`${character.name} HP`}
          aria-valuenow={character.currentHp}
          aria-valuemin={0}
          aria-valuemax={character.baseStats.hp}
          className="h-3 bg-gray-700 rounded-full overflow-hidden"
        >
          <div
            className="h-full bg-linear-to-r from-red-600 to-red-400 transition-all duration-300"
            style={{ width: `${hpPercent}%` }}
          />
        </div>
      </div>

      {/* MP 바 */}
      <div className="mb-3">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-blue-400">MP</span>
          <span>
            {character.currentMp} / {character.baseStats.mp}
          </span>
        </div>
        <div
          role="progressbar"
          aria-label={`${character.name} MP`}
          aria-valuenow={character.currentMp}
          aria-valuemin={0}
          aria-valuemax={character.baseStats.mp}
          className="h-3 bg-gray-700 rounded-full overflow-hidden"
        >
          <div
            className="h-full bg-linear-to-r from-blue-600 to-blue-400 transition-all duration-300"
            style={{ width: `${mpPercent}%` }}
          />
        </div>
      </div>

      {/* 버프/디버프 */}
      {(buffs.length > 0 || debuffs.length > 0) && (
        <div className="flex flex-wrap gap-1">
          {buffs.map((e) => (
            <span
              key={e.id}
              className="text-xs px-2 py-0.5 bg-green-900 text-green-300 rounded"
            >
              {e.targetStat.toUpperCase()} +{e.amount} ({e.remainingTurns}t)
            </span>
          ))}
          {debuffs.map((e) => (
            <span
              key={e.id}
              className="text-xs px-2 py-0.5 bg-red-900 text-red-300 rounded"
            >
              {e.targetStat.toUpperCase()} -{e.amount} ({e.remainingTurns}t)
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
