import type { ActiveEffect, BuffTargetStat } from '../types'

let effectIdCounter = 0

/** 고유 ID 생성 (테스트 시 리셋 가능하도록 카운터 기반) */
export function generateEffectId(): string {
  return `effect-${++effectIdCounter}`
}

/** 테스트용 카운터 리셋 */
export function resetEffectIdCounter(): void {
  effectIdCounter = 0
}

/**
 * 유효 스탯 계산: 기본 스탯 + 버프 합산 - 디버프 합산
 * 최소값 0 보장
 */
export function getEffectiveStat(
  baseStat: number,
  statType: BuffTargetStat,
  activeEffects: ActiveEffect[],
): number {
  let modifier = 0

  for (const effect of activeEffects) {
    if (effect.targetStat !== statType) continue
    if (effect.type === 'buff') {
      modifier += effect.amount
    } else {
      modifier -= effect.amount
    }
  }

  return Math.max(0, baseStat + modifier)
}

/** tick 전 만료 예정 효과를 반환 (remainingTurns === 1인 효과는 tick 후 제거됨) */
export function findExpiringEffects(effects: ActiveEffect[]): ActiveEffect[] {
  return effects.filter((e) => e.remainingTurns === 1)
}

/**
 * 턴 종료 시 모든 효과의 remainingTurns를 1 감소.
 * 0이 된 효과는 제거. 원본 배열을 변경하지 않음.
 */
export function tickEffects(effects: ActiveEffect[]): ActiveEffect[] {
  return effects
    .map((e) => ({ ...e, remainingTurns: e.remainingTurns - 1 }))
    .filter((e) => e.remainingTurns > 0)
}

/**
 * 새 효과 추가. 같은 type+targetStat 효과가 이미 있으면 교체(갱신).
 * 동일 스탯에 대한 무한 중첩을 방지한다.
 * 원본 배열을 변경하지 않음.
 */
export function addEffect(
  effects: ActiveEffect[],
  type: 'buff' | 'debuff',
  targetStat: BuffTargetStat,
  amount: number,
  duration: number,
  sourceName: string,
): ActiveEffect[] {
  const newEffect: ActiveEffect = {
    id: generateEffectId(),
    type,
    targetStat,
    amount,
    remainingTurns: duration,
    sourceName,
  }
  // 같은 type+targetStat 효과를 교체 (중첩 방지)
  const filtered = effects.filter(
    (e) => !(e.type === type && e.targetStat === targetStat),
  )
  return [...filtered, newEffect]
}
