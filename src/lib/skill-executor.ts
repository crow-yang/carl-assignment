import type { Character, Skill, TurnLogEntry, ActiveEffect } from '../types'
import { calculateDamage } from './damage'
import { getEffectiveStat, addEffect } from './effects'

/** MP 소모량 계산 (-0 방지) */
function mpChange(cost: number): number {
  return cost === 0 ? 0 : -cost
}

export interface SkillExecutionResult {
  targetHpChange: number    // 음수 = 데미지
  actorHpChange: number     // 양수 = 힐 (최대 HP 초과 불가 적용 후)
  actorMpChange: number     // 음수 = MP 소모
  newActorEffects: ActiveEffect[]
  newTargetEffects: ActiveEffect[]
  isDefending: boolean
  logEntry: TurnLogEntry
}

/**
 * 스킬 실행 결과 계산. 순수 함수.
 *
 * 스킬 타입별 동작:
 *   attack  → 데미지 계산, 상대 HP 감소
 *   defend  → 이번 턴 방어 플래그
 *   heal    → 자신 HP 회복 (최대 HP 초과 불가)
 *   buff    → 자신에게 버프 효과 추가
 *   debuff  → 상대에게 디버프 효과 추가
 */
export function executeSkill(
  actor: Character,
  target: Character,
  skill: Skill,
  round: number,
  actorSide: 'player' | 'enemy',
  isTargetDefending: boolean,
): SkillExecutionResult {
  const actorName = actor.name
  const targetName = target.name

  switch (skill.type) {
    case 'attack': {
      const effectiveAtk = getEffectiveStat(actor.baseStats.atk, 'atk', actor.activeEffects)
      const effectiveDef = getEffectiveStat(target.baseStats.def, 'def', target.activeEffects)
      const damage = calculateDamage(effectiveAtk, skill.multiplier, effectiveDef, isTargetDefending)

      return {
        targetHpChange: -damage,
        actorHpChange: 0,
        actorMpChange: mpChange(skill.mpCost),
        newActorEffects: actor.activeEffects,
        newTargetEffects: target.activeEffects,
        isDefending: false,
        logEntry: {
          round,
          actor: actorSide,
          actorName,
          skillType: skill.type,
          action: skill.isDefault
            ? `${actorName}의 기본 공격! ${targetName}에게 ${damage} 데미지`
            : `${actorName}이(가) ${skill.name} 사용! ${targetName}에게 ${damage} 데미지`,
          damage,
        },
      }
    }

    case 'defend': {
      return {
        targetHpChange: 0,
        actorHpChange: 0,
        actorMpChange: 0,
        newActorEffects: actor.activeEffects,
        newTargetEffects: target.activeEffects,
        isDefending: true,
        logEntry: {
          round,
          actor: actorSide,
          actorName,
          skillType: skill.type,
          action: `${actorName}이(가) 방어 자세를 취했다!`,
        },
      }
    }

    case 'heal': {
      const maxHp = actor.baseStats.hp
      const currentHp = actor.currentHp
      const actualHeal = Math.min(skill.healAmount, maxHp - currentHp)

      return {
        targetHpChange: 0,
        actorHpChange: actualHeal,
        actorMpChange: mpChange(skill.mpCost),
        newActorEffects: actor.activeEffects,
        newTargetEffects: target.activeEffects,
        isDefending: false,
        logEntry: {
          round,
          actor: actorSide,
          actorName,
          skillType: skill.type,
          action: `${actorName}이(가) ${skill.name} 사용! HP ${actualHeal} 회복`,
          heal: actualHeal,
        },
      }
    }

    case 'buff': {
      const newEffects = addEffect(
        actor.activeEffects,
        'buff',
        skill.targetStat,
        skill.amount,
        skill.duration,
        skill.name,
      )

      return {
        targetHpChange: 0,
        actorHpChange: 0,
        actorMpChange: mpChange(skill.mpCost),
        newActorEffects: newEffects,
        newTargetEffects: target.activeEffects,
        isDefending: false,
        logEntry: {
          round,
          actor: actorSide,
          actorName,
          skillType: skill.type,
          action: `${actorName}이(가) ${skill.name} 사용! ${skill.targetStat.toUpperCase()} +${skill.amount} (${skill.duration}턴)`,
          effect: `${skill.targetStat.toUpperCase()} +${skill.amount}`,
        },
      }
    }

    case 'debuff': {
      const newEffects = addEffect(
        target.activeEffects,
        'debuff',
        skill.targetStat,
        skill.amount,
        skill.duration,
        skill.name,
      )

      return {
        targetHpChange: 0,
        actorHpChange: 0,
        actorMpChange: mpChange(skill.mpCost),
        newActorEffects: actor.activeEffects,
        newTargetEffects: newEffects,
        isDefending: false,
        logEntry: {
          round,
          actor: actorSide,
          actorName,
          skillType: skill.type,
          action: `${actorName}이(가) ${skill.name} 사용! ${targetName}의 ${skill.targetStat.toUpperCase()} -${skill.amount} (${skill.duration}턴)`,
          effect: `${skill.targetStat.toUpperCase()} -${skill.amount}`,
        },
      }
    }
  }
}
