import { DEF_MULTIPLIER, DEFEND_DAMAGE_REDUCTION, MIN_DAMAGE } from '../constants'

/**
 * 데미지 공식:
 *   damage = (공격자 ATK × 배율 - 상대 DEF × 0.5) × (방어 중이면 0.5, 아니면 1.0)
 *   최소 데미지 1 보장
 *
 * ATK/DEF는 버프/디버프가 반영된 유효 스탯 기준.
 */
export function calculateDamage(
  attackerAtk: number,
  multiplier: number,
  defenderDef: number,
  isDefending: boolean,
): number {
  const raw =
    (attackerAtk * multiplier - defenderDef * DEF_MULTIPLIER) *
    (isDefending ? DEFEND_DAMAGE_REDUCTION : 1.0)
  return Math.max(MIN_DAMAGE, Math.floor(raw))
}
