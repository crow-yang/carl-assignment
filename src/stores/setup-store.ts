import { create } from 'zustand'
import type { Stats, StatType, Difficulty, Skill, CustomSkillType, BuffTargetStat } from '../types'
import { DEFAULT_STATS, DEFAULT_SKILLS, MAX_CUSTOM_SKILLS, STAT_RANGES, TOTAL_STAT_POINTS, sumStats } from '../constants'

interface SetupState {
  currentStep: 1 | 2 | 3
  name: string
  stats: Stats
  customSkills: Skill[]
  difficulty: Difficulty | null
}

interface SetupActions {
  setCurrentStep: (step: 1 | 2 | 3) => void
  nextStep: () => void
  prevStep: () => void
  setName: (name: string) => void
  setStat: (stat: StatType, value: number) => void
  addCustomSkill: (input: {
    name: string
    type: CustomSkillType
    mpCost: number
    multiplier?: number
    healAmount?: number
    targetStat?: BuffTargetStat
    amount?: number
    duration?: number
  }) => void
  removeCustomSkill: (skillId: string) => void
  setDifficulty: (difficulty: Difficulty) => void
  getAllSkills: () => Skill[]
  getRemainingPoints: () => number
  reset: () => void
}

const initialState: SetupState = {
  currentStep: 1,
  name: '',
  stats: { ...DEFAULT_STATS },
  customSkills: [],
  difficulty: null,
}

let skillIdCounter = 0

export const useSetupStore = create<SetupState & SetupActions>((set, get) => ({
  ...initialState,

  setCurrentStep: (step) => set({ currentStep: step }),

  nextStep: () =>
    set((s) => ({
      currentStep: Math.min(3, s.currentStep + 1) as 1 | 2 | 3,
    })),

  prevStep: () =>
    set((s) => ({
      currentStep: Math.max(1, s.currentStep - 1) as 1 | 2 | 3,
    })),

  setName: (name) => set({ name }),

  setStat: (stat, value) => {
    const range = STAT_RANGES[stat]
    const clamped = Math.max(range.min, Math.min(range.max, value))
    set((s) => {
      // 다른 스탯의 합산을 구해서, 이 스탯에 배분 가능한 최대치를 계산
      const otherTotal = (Object.keys(s.stats) as StatType[])
        .filter((k) => k !== stat)
        .reduce((sum, k) => sum + s.stats[k], 0)
      const maxAllowed = Math.max(range.min, TOTAL_STAT_POINTS - otherTotal)
      return { stats: { ...s.stats, [stat]: Math.min(clamped, maxAllowed) } }
    })
  },

  addCustomSkill: (input) => {
    const state = get()
    if (state.customSkills.length >= MAX_CUSTOM_SKILLS) return

    const id = `custom-skill-${++skillIdCounter}`
    let skill: Skill

    switch (input.type) {
      case 'attack':
        skill = {
          id, name: input.name, type: 'attack',
          mpCost: input.mpCost, multiplier: input.multiplier ?? 1.0, isDefault: false,
        }
        break
      case 'heal':
        skill = {
          id, name: input.name, type: 'heal',
          mpCost: input.mpCost, healAmount: input.healAmount ?? 10, isDefault: false,
        }
        break
      case 'buff':
      case 'debuff':
        skill = {
          id, name: input.name, type: input.type,
          mpCost: input.mpCost, targetStat: input.targetStat ?? 'atk',
          amount: input.amount ?? 1, duration: input.duration ?? 1, isDefault: false,
        }
        break
    }

    set((s) => ({ customSkills: [...s.customSkills, skill] }))
  },

  removeCustomSkill: (skillId) =>
    set((s) => ({
      customSkills: s.customSkills.filter((sk) => sk.id !== skillId),
    })),

  setDifficulty: (difficulty) => set({ difficulty }),

  getAllSkills: () => [...DEFAULT_SKILLS, ...get().customSkills],

  getRemainingPoints: () => {
    return TOTAL_STAT_POINTS - sumStats(get().stats)
  },

  reset: () => {
    skillIdCounter = 0
    set({ ...initialState, stats: { ...DEFAULT_STATS }, customSkills: [] })
  },
}))
