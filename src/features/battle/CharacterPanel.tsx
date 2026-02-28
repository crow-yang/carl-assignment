import type { ReactNode } from 'react'
import type { Character } from '../../types'
import type { VisualEffect } from './battle-visual-helpers'
import { getEffectiveStat } from '../../lib/effects'

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
  <svg viewBox="0 0 64 64" fill="none" className="w-12 h-12">
    {/* 검 */}
    <path d="M32 6L36 22H28L32 6Z" fill="#93C5FD" />
    <rect x="30" y="22" width="4" height="18" rx="1" fill="#60A5FA" />
    <rect x="26" y="20" width="12" height="3" rx="1.5" fill="#93C5FD" />
    {/* 방패 */}
    <path d="M20 32L32 28L44 32L44 44L32 52L20 44Z" fill="#3B82F6" />
    <path d="M24 34L32 31L40 34L40 42L32 48L24 42Z" fill="#1D4ED8" />
    <path d="M32 35L36 38L32 45L28 38Z" fill="#60A5FA" />
  </svg>
)

const ENEMY_SVGS: Record<string, ReactNode> = {
  '슬라임': (
    <svg viewBox="0 0 64 64" fill="none" className="w-12 h-12">
      <ellipse cx="32" cy="46" rx="22" ry="10" fill="#22C55E" opacity="0.4" />
      <ellipse cx="32" cy="38" rx="18" ry="16" fill="#4ADE80" />
      <ellipse cx="32" cy="36" rx="16" ry="14" fill="#22C55E" />
      <ellipse cx="25" cy="33" rx="4" ry="4.5" fill="white" />
      <ellipse cx="39" cy="33" rx="4" ry="4.5" fill="white" />
      <circle cx="26" cy="34" r="2" fill="#1E293B" />
      <circle cx="40" cy="34" r="2" fill="#1E293B" />
      <circle cx="26.8" cy="33" r="0.8" fill="white" />
      <circle cx="40.8" cy="33" r="0.8" fill="white" />
      <path d="M27 40Q32 43 37 40" stroke="#166534" strokeWidth="1.5" strokeLinecap="round" />
      <ellipse cx="24" cy="28" rx="3" ry="2" fill="white" opacity="0.3" />
    </svg>
  ),
  '오크 전사': (
    <svg viewBox="0 0 64 64" fill="none" className="w-12 h-12">
      <rect x="20" y="44" width="24" height="10" rx="4" fill="#7C3AED" />
      <circle cx="32" cy="28" r="16" fill="#A78BFA" />
      <circle cx="32" cy="28" r="14" fill="#8B5CF6" />
      <path d="M18 20L22 12L24 22" fill="#7C3AED" />
      <path d="M46 20L42 12L40 22" fill="#7C3AED" />
      <circle cx="25" cy="26" r="4" fill="#FDE68A" />
      <circle cx="39" cy="26" r="4" fill="#FDE68A" />
      <circle cx="25" cy="26" r="2" fill="#92400E" />
      <circle cx="39" cy="26" r="2" fill="#92400E" />
      <path d="M26 36L28 33L30 36" fill="white" />
      <path d="M34 36L36 33L38 36" fill="white" />
      <path d="M25 34Q32 38 39 34" stroke="#1E293B" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  '드래곤 나이트': (
    <svg viewBox="0 0 64 64" fill="none" className="w-12 h-12">
      <path d="M8 22L18 16L22 28L14 32Z" fill="#991B1B" opacity="0.7" />
      <path d="M56 22L46 16L42 28L50 32Z" fill="#991B1B" opacity="0.7" />
      <path d="M24 28L32 20L40 28L40 48L24 48Z" fill="#DC2626" />
      <path d="M26 30L32 24L38 30L38 46L26 46Z" fill="#991B1B" />
      <path d="M32 8L40 18L36 20L32 12L28 20L24 18Z" fill="#F87171" />
      <path d="M26 18L32 14L38 18L38 24L26 24Z" fill="#EF4444" />
      <ellipse cx="29" cy="21" rx="2" ry="1.5" fill="#FBBF24" />
      <ellipse cx="35" cy="21" rx="2" ry="1.5" fill="#FBBF24" />
      <path d="M32 32L35 36L32 44L29 36Z" fill="#FCA5A5" />
      <rect x="26" y="48" width="5" height="6" rx="2" fill="#7F1D1D" />
      <rect x="33" y="48" width="5" height="6" rx="2" fill="#7F1D1D" />
    </svg>
  ),
}

const DEFAULT_ENEMY_SVG = (
  <svg viewBox="0 0 64 64" fill="none" className="w-12 h-12">
    <circle cx="32" cy="30" r="18" fill="#F87171" />
    <circle cx="32" cy="30" r="15" fill="#EF4444" />
    <circle cx="26" cy="27" r="3" fill="white" />
    <circle cx="38" cy="27" r="3" fill="white" />
    <circle cx="26.5" cy="27.5" r="1.5" fill="#1E293B" />
    <circle cx="38.5" cy="27.5" r="1.5" fill="#1E293B" />
    <path d="M26 36Q32 40 38 36" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
)

export function CharacterPanel({ character, side, activeEffect }: CharacterPanelProps) {
  const hpPercent = Math.max(0, (character.currentHp / character.baseStats.hp) * 100)
  const mpPercent = Math.max(0, (character.currentMp / character.baseStats.mp) * 100)
  const hpLow = hpPercent <= 30

  const effectiveAtk = getEffectiveStat(character.baseStats.atk, 'atk', character.activeEffects)
  const effectiveDef = getEffectiveStat(character.baseStats.def, 'def', character.activeEffects)
  const atkModified = effectiveAtk !== character.baseStats.atk
  const defModified = effectiveDef !== character.baseStats.def

  const testIdPrefix = side === 'player' ? 'player' : 'enemy'
  const buffs = character.activeEffects.filter((e) => e.type === 'buff')
  const debuffs = character.activeEffects.filter((e) => e.type === 'debuff')
  const effectClass = activeEffect ? EFFECT_CLASS[activeEffect] ?? '' : ''

  const borderColor = side === 'player' ? 'border-blue-700/80' : 'border-red-700/80'
  const glowShadow = side === 'player' ? 'shadow-blue-500/10' : 'shadow-red-500/10'
  const avatarGradient = side === 'player'
    ? 'from-blue-600/40 to-blue-900/60'
    : 'from-red-600/40 to-red-900/60'
  const avatarRing = side === 'player' ? 'ring-blue-400/50' : 'ring-red-400/50'

  return (
    <div
      data-testid={`${testIdPrefix}-panel`}
      className={`p-4 bg-gray-800/90 backdrop-blur rounded-2xl border shadow-lg ${borderColor} ${glowShadow} ${effectClass}`}
    >
      {/* 캐릭터 아바타 + 이름 */}
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-16 h-16 rounded-xl bg-linear-to-br ${avatarGradient} ring-2 ${avatarRing} flex items-center justify-center shrink-0`}>
          <span aria-hidden="true">
            {side === 'player' ? PLAYER_SVG : (ENEMY_SVGS[character.name] ?? DEFAULT_ENEMY_SVG)}
          </span>
        </div>
        <div className="min-w-0">
          <h3
            data-testid={`${testIdPrefix}-name`}
            className="text-base sm:text-lg font-bold truncate"
          >
            {character.name}
          </h3>
          <div className="flex gap-3 text-xs mt-0.5">
            <span className={atkModified ? (effectiveAtk > character.baseStats.atk ? 'text-green-400' : 'text-red-400') : 'text-gray-400'}>
              ATK {effectiveAtk}
            </span>
            <span className={defModified ? (effectiveDef > character.baseStats.def ? 'text-green-400' : 'text-red-400') : 'text-gray-400'}>
              DEF {effectiveDef}
            </span>
          </div>
        </div>
      </div>

      {/* HP 바 */}
      <div className="mb-2">
        <div className="flex justify-between text-xs mb-1">
          <span className={hpLow ? 'text-red-400 animate-pulse font-semibold' : 'text-red-400'}>HP</span>
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
            className={`h-full rounded-full transition-all duration-300 ${
              hpLow
                ? 'bg-linear-to-r from-red-700 to-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]'
                : 'bg-linear-to-r from-red-600 to-red-400'
            }`}
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
            className="h-full rounded-full bg-linear-to-r from-blue-600 to-blue-400 transition-all duration-300"
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
              className="text-xs px-2 py-0.5 bg-green-900/70 text-green-300 rounded-full border border-green-700/40"
            >
              {e.targetStat.toUpperCase()} +{e.amount} ({e.remainingTurns}t)
            </span>
          ))}
          {debuffs.map((e) => (
            <span
              key={e.id}
              className="text-xs px-2 py-0.5 bg-red-900/70 text-red-300 rounded-full border border-red-700/40"
            >
              {e.targetStat.toUpperCase()} -{e.amount} ({e.remainingTurns}t)
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
