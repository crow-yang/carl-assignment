import type {
  Character, BattleAction, Skill, ActionQueueItem, TurnLogEntry, ActiveEffect,
} from '../types'
import type { SkillExecutionResult } from './skill-executor'

// ─── 스킬 결정 ────────────────────────────────────────

export function resolveSkill(character: Character, action: BattleAction): Skill | null {
  if (action.type === 'attack') {
    return character.skills.find((s) => s.type === 'attack' && s.isDefault) ?? null
  }
  if (action.type === 'defend') {
    return character.skills.find((s) => s.type === 'defend') ?? null
  }
  if (action.type === 'skill' && action.skillId) {
    const skill = character.skills.find((s) => s.id === action.skillId)
    if (skill && character.currentMp >= skill.mpCost) return skill
  }
  return null
}

// ─── 캐릭터 상태 적용 ─────────────────────────────────

export function applyActorResult(actor: Character, result: SkillExecutionResult): Character {
  return {
    ...actor,
    currentHp: Math.min(actor.baseStats.hp, actor.currentHp + result.actorHpChange),
    currentMp: Math.max(0, actor.currentMp + result.actorMpChange),
    activeEffects: result.newActorEffects,
  }
}

export function applyTargetResult(target: Character, result: SkillExecutionResult): Character {
  return {
    ...target,
    currentHp: Math.max(0, target.currentHp + result.targetHpChange),
    activeEffects: result.newTargetEffects,
  }
}

// ─── 큐 아이템 생성 ──────────────────────────────────

function determineQueueItemType(logEntry: TurnLogEntry): ActionQueueItem['type'] {
  switch (logEntry.skillType) {
    case 'attack': return 'damage'
    case 'heal': return 'heal'
    case 'defend': return 'defend'
    case 'buff': return 'buff'
    case 'debuff': return 'debuff'
  }
}

/** skillType에 따라 큐 아이템에 표시할 value를 명시적으로 결정 */
function resolveQueueValue(logEntry: TurnLogEntry): number | undefined {
  switch (logEntry.skillType) {
    case 'attack': return logEntry.damage
    case 'heal': return logEntry.heal
    case 'defend': return undefined
    case 'buff': return undefined
    case 'debuff': return undefined
  }
}

export function toQueueItem(
  logEntry: TurnLogEntry,
  side: 'player' | 'enemy',
  playerSnapshot: Character,
  enemySnapshot: Character,
): ActionQueueItem {
  return {
    type: determineQueueItemType(logEntry),
    actor: side,
    actorName: logEntry.actorName,
    description: logEntry.action,
    value: resolveQueueValue(logEntry),
    logEntry,
    playerSnapshot,
    enemySnapshot,
  }
}

/** 만료 효과에 대한 큐 아이템 + 로그 엔트리 생성 */
export function makeExpireItems(
  expired: ActiveEffect[],
  side: 'player' | 'enemy',
  characterName: string,
  round: number,
  playerSnapshot: Character,
  enemySnapshot: Character,
): { queueItem: ActionQueueItem; logEntry: TurnLogEntry }[] {
  return expired.map((effect) => {
    const sign = effect.type === 'buff' ? '+' : '-'
    const logEntry: TurnLogEntry = {
      id: crypto.randomUUID(),
      round,
      actor: side,
      actorName: characterName,
      skillType: effect.type,
      action: `${characterName}의 ${effect.sourceName} 효과(${effect.targetStat.toUpperCase()} ${sign}${effect.amount})가 만료됐다`,
    }
    return {
      logEntry,
      queueItem: {
        type: 'effect-expire' as const,
        actor: side,
        actorName: characterName,
        description: logEntry.action,
        value: effect.amount,
        targetStat: effect.targetStat,
        logEntry,
        playerSnapshot,
        enemySnapshot,
      },
    }
  })
}
