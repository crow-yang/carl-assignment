import { describe, it, expect, beforeEach } from 'vitest'
import { useSetupStore, selectRemainingPoints } from './setup-store'
import { DEFAULT_STATS, DEFAULT_SKILLS, STAT_RANGES, TOTAL_STAT_POINTS, MAX_CUSTOM_SKILLS } from '../constants'

describe('setup-store', () => {
  beforeEach(() => {
    useSetupStore.getState().reset()
  })

  // ─── 초기 상태 ─────────────────────────────────────────
  it('초기 상태 확인', () => {
    const s = useSetupStore.getState()
    expect(s.currentStep).toBe(1)
    expect(s.name).toBe('')
    expect(s.stats).toEqual(DEFAULT_STATS)
    expect(s.customSkills).toEqual([])
    expect(s.difficulty).toBeNull()
  })

  // ─── 스텝 네비게이션 ──────────────────────────────────
  it('nextStep: 1 → 2 → 3', () => {
    const store = useSetupStore.getState()
    store.nextStep()
    expect(useSetupStore.getState().currentStep).toBe(2)
    useSetupStore.getState().nextStep()
    expect(useSetupStore.getState().currentStep).toBe(3)
  })

  it('nextStep: 3에서 더 이상 안 넘어감', () => {
    useSetupStore.getState().setCurrentStep(3)
    useSetupStore.getState().nextStep()
    expect(useSetupStore.getState().currentStep).toBe(3)
  })

  it('prevStep: 3 → 2 → 1', () => {
    useSetupStore.getState().setCurrentStep(3)
    useSetupStore.getState().prevStep()
    expect(useSetupStore.getState().currentStep).toBe(2)
    useSetupStore.getState().prevStep()
    expect(useSetupStore.getState().currentStep).toBe(1)
  })

  it('prevStep: 1에서 더 이상 안 내려감', () => {
    useSetupStore.getState().prevStep()
    expect(useSetupStore.getState().currentStep).toBe(1)
  })

  // ─── 이름 설정 ────────────────────────────────────────
  it('setName', () => {
    useSetupStore.getState().setName('용사')
    expect(useSetupStore.getState().name).toBe('용사')
  })

  // ─── 스탯 설정 ────────────────────────────────────────
  it('setStat: 범위 내 값 설정', () => {
    useSetupStore.getState().setStat('hp', 50)
    expect(useSetupStore.getState().stats.hp).toBe(50)
  })

  it('setStat: 최소값 미만은 클램핑', () => {
    useSetupStore.getState().setStat('hp', 0)
    expect(useSetupStore.getState().stats.hp).toBe(STAT_RANGES.hp.min)
  })

  it('setStat: 최대값 초과는 클램핑', () => {
    useSetupStore.getState().setStat('hp', 999)
    expect(useSetupStore.getState().stats.hp).toBe(STAT_RANGES.hp.max)
  })

  // ─── 잔여 포인트 ──────────────────────────────────────
  it('selectRemainingPoints: 초기값', () => {
    const remaining = selectRemainingPoints(useSetupStore.getState())
    const usedByDefault = DEFAULT_STATS.hp + DEFAULT_STATS.mp + DEFAULT_STATS.atk + DEFAULT_STATS.def + DEFAULT_STATS.spd
    expect(remaining).toBe(TOTAL_STAT_POINTS - usedByDefault)
  })

  // ─── 커스텀 스킬 ──────────────────────────────────────
  it('addCustomSkill: 공격 스킬 추가', () => {
    useSetupStore.getState().addCustomSkill({
      name: '화염참', type: 'attack', mpCost: 10, multiplier: 1.5,
    })
    const skills = useSetupStore.getState().customSkills
    expect(skills).toHaveLength(1)
    expect(skills[0].name).toBe('화염참')
    expect(skills[0].type).toBe('attack')
  })

  it('addCustomSkill: 힐 스킬 추가', () => {
    useSetupStore.getState().addCustomSkill({
      name: '치유의 빛', type: 'heal', mpCost: 15, healAmount: 30,
    })
    const skills = useSetupStore.getState().customSkills
    expect(skills).toHaveLength(1)
    expect(skills[0].type).toBe('heal')
  })

  it('addCustomSkill: 버프 스킬 추가', () => {
    useSetupStore.getState().addCustomSkill({
      name: '기합', type: 'buff', mpCost: 8, targetStat: 'atk', amount: 5, duration: 3,
    })
    const skills = useSetupStore.getState().customSkills
    expect(skills).toHaveLength(1)
    expect(skills[0].type).toBe('buff')
  })

  it('addCustomSkill: 디버프 스킬 추가', () => {
    useSetupStore.getState().addCustomSkill({
      name: '약화', type: 'debuff', mpCost: 8, targetStat: 'def', amount: 3, duration: 2,
    })
    const skills = useSetupStore.getState().customSkills
    expect(skills).toHaveLength(1)
    expect(skills[0].type).toBe('debuff')
  })

  it('addCustomSkill: 옵셔널 필드 생략 시 기본값 적용', () => {
    // attack — multiplier 생략
    useSetupStore.getState().addCustomSkill({ name: 'a', type: 'attack', mpCost: 5 })
    const atk = useSetupStore.getState().customSkills[0]
    if (atk.type === 'attack') expect(atk.multiplier).toBe(1.0)

    useSetupStore.getState().reset()

    // heal — healAmount 생략
    useSetupStore.getState().addCustomSkill({ name: 'b', type: 'heal', mpCost: 5 })
    const heal = useSetupStore.getState().customSkills[0]
    if (heal.type === 'heal') expect(heal.healAmount).toBe(10)

    useSetupStore.getState().reset()

    // buff — targetStat, amount, duration 생략
    useSetupStore.getState().addCustomSkill({ name: 'c', type: 'buff', mpCost: 5 })
    const buff = useSetupStore.getState().customSkills[0]
    if (buff.type === 'buff') {
      expect(buff.targetStat).toBe('atk')
      expect(buff.amount).toBe(1)
      expect(buff.duration).toBe(1)
    }
  })

  it('addCustomSkill: 최대 개수 초과 시 무시', () => {
    for (let i = 0; i < MAX_CUSTOM_SKILLS + 2; i++) {
      useSetupStore.getState().addCustomSkill({
        name: `스킬${i}`, type: 'attack', mpCost: 5, multiplier: 1.0,
      })
    }
    expect(useSetupStore.getState().customSkills).toHaveLength(MAX_CUSTOM_SKILLS)
  })

  it('removeCustomSkill', () => {
    useSetupStore.getState().addCustomSkill({
      name: '화염참', type: 'attack', mpCost: 10, multiplier: 1.5,
    })
    const skillId = useSetupStore.getState().customSkills[0].id
    useSetupStore.getState().removeCustomSkill(skillId)
    expect(useSetupStore.getState().customSkills).toHaveLength(0)
  })

  // ─── 전체 스킬 목록 ──────────────────────────────────
  it('getAllSkills: 기본 스킬 + 커스텀 스킬', () => {
    useSetupStore.getState().addCustomSkill({
      name: '화염참', type: 'attack', mpCost: 10, multiplier: 1.5,
    })
    const allSkills = useSetupStore.getState().getAllSkills()
    expect(allSkills).toHaveLength(DEFAULT_SKILLS.length + 1)
  })

  // ─── 난이도 설정 ──────────────────────────────────────
  it('setDifficulty', () => {
    useSetupStore.getState().setDifficulty('hard')
    expect(useSetupStore.getState().difficulty).toBe('hard')
  })

  // ─── 리셋 ─────────────────────────────────────────────
  it('reset: 모든 상태 초기화', () => {
    useSetupStore.getState().setName('용사')
    useSetupStore.getState().setStat('hp', 80)
    useSetupStore.getState().addCustomSkill({
      name: '화염참', type: 'attack', mpCost: 10, multiplier: 1.5,
    })
    useSetupStore.getState().setDifficulty('hard')
    useSetupStore.getState().nextStep()

    useSetupStore.getState().reset()
    const s = useSetupStore.getState()
    expect(s.currentStep).toBe(1)
    expect(s.name).toBe('')
    expect(s.stats).toEqual(DEFAULT_STATS)
    expect(s.customSkills).toEqual([])
    expect(s.difficulty).toBeNull()
  })
})
