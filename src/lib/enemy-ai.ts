import type { Character, Difficulty, BattleAction, Skill } from '../types'

/**
 * 적 AI 행동 결정.
 *
 * 난이도별 전략:
 *   쉬움:   단순. 70% 기본공격, 20% 강타(MP있을때), 10% 방어
 *   보통:   상황 판단. HP 낮으면 방어적. 회복 활용.
 *   어려움: 전략적. 디버프 우선, 위기 시 방어/회복, 마무리 강타.
 *
 * rng 파라미터로 테스트 시 결정적 동작 보장.
 */
export function decideEnemyAction(
  self: Character,
  opponent: Character,
  difficulty: Difficulty,
  rng: () => number = Math.random,
): BattleAction {
  switch (difficulty) {
    case 'easy':
      return decideEasy(self, rng)
    case 'normal':
      return decideNormal(self, rng)
    case 'hard':
      return decideHard(self, opponent, rng)
  }
}

/** 사용 가능한 스킬 찾기 (MP 충분한 것만) */
function findUsableSkill(self: Character, skillId: string): Skill | undefined {
  return self.skills.find((s) => s.id === skillId && self.currentMp >= s.mpCost)
}

/** 기본 공격 액션 반환 (항상 사용 가능한 fallback) */
function basicAttack(): BattleAction {
  return { type: 'attack' }
}

function defend(): BattleAction {
  return { type: 'defend' }
}

function skillAction(skillId: string): BattleAction {
  return { type: 'skill', skillId }
}

// ─── 쉬움 ──────────────────────────────────────────────────
function decideEasy(self: Character, rng: () => number): BattleAction {
  const roll = rng()
  const smash = findUsableSkill(self, 'enemy-smash-easy')

  if (roll < 0.1) return defend()
  if (roll < 0.3 && smash) return skillAction(smash.id)
  return basicAttack()
}

// ─── 보통 ──────────────────────────────────────────────────
function decideNormal(self: Character, rng: () => number): BattleAction {
  const hpRatio = self.currentHp / self.baseStats.hp
  const heal = findUsableSkill(self, 'enemy-heal-normal')
  const smash = findUsableSkill(self, 'enemy-smash-normal')
  const roll = rng()

  // HP <= 50%: 방어적 행동
  if (hpRatio <= 0.5) {
    if (heal && hpRatio <= 0.7 && roll < 0.4) return skillAction(heal.id)
    if (roll < 0.6) return defend()
    if (smash && roll < 0.8) return skillAction(smash.id)
    return basicAttack()
  }

  // HP > 50%: 공격적 행동
  if (smash && roll < 0.3) return skillAction(smash.id)
  if (heal && hpRatio <= 0.7 && roll < 0.4) return skillAction(heal.id)
  if (roll < 0.9) return basicAttack()
  return defend()
}

// ─── 어려움 ────────────────────────────────────────────────
function decideHard(self: Character, opponent: Character, rng: () => number): BattleAction {
  const hpRatio = self.currentHp / self.baseStats.hp
  const opponentHpRatio = opponent.currentHp / opponent.baseStats.hp
  const heal = findUsableSkill(self, 'enemy-heal-hard')
  const smash = findUsableSkill(self, 'enemy-smash-hard')
  const weaken = findUsableSkill(self, 'enemy-weaken-hard')

  // 1. 위기 상황 (HP <= 30%): 생존 우선
  if (hpRatio <= 0.3) {
    if (heal) return skillAction(heal.id)
    return defend()
  }

  // 2. 상대에게 DEF 디버프가 없으면 약화 시전
  const hasDefDebuff = opponent.activeEffects.some(
    (e) => e.type === 'debuff' && e.targetStat === 'def',
  )
  if (!hasDefDebuff && weaken) return skillAction(weaken.id)

  // 3. 상대 HP 낮으면 강타로 마무리
  if (opponentHpRatio <= 0.3 && smash) return skillAction(smash.id)

  // 4. 일반 상황: 강타/기본공격 번갈아
  const roll = rng()
  if (smash && roll < 0.5) return skillAction(smash.id)
  if (heal && hpRatio <= 0.6 && roll < 0.7) return skillAction(heal.id)
  return basicAttack()
}
