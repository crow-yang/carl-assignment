import { describe, it, expect, beforeEach } from 'vitest'
import { useBattleStore } from './battle-store'
import { DEFAULT_SKILLS, ENEMY_STATS, ENEMY_NAMES, ENEMY_SKILLS } from '../constants'
import type { Stats, Skill } from '../types'

const playerStats: Stats = { hp: 60, mp: 40, atk: 20, def: 15, spd: 10 }
const playerSkills: Skill[] = [
  ...DEFAULT_SKILLS,
  { id: 'fire-slash', name: '화염참', type: 'attack', mpCost: 10, multiplier: 1.5, isDefault: false },
]

describe('battle-store', () => {
  beforeEach(() => {
    useBattleStore.getState().reset()
  })

  // ─── initBattle ────────────────────────────────────────
  describe('initBattle', () => {
    it('전투 초기화: 플레이어와 적 생성', () => {
      useBattleStore.getState().initBattle('용사', playerStats, playerSkills, 'easy')
      const bs = useBattleStore.getState().battleState!

      expect(bs.round).toBe(1)
      expect(bs.player.name).toBe('용사')
      expect(bs.player.currentHp).toBe(playerStats.hp)
      expect(bs.player.currentMp).toBe(playerStats.mp)
      expect(bs.player.skills).toEqual(playerSkills)
      expect(bs.enemy.name).toBe(ENEMY_NAMES.easy)
      expect(bs.enemy.baseStats).toEqual(ENEMY_STATS.easy)
      expect(bs.enemy.skills).toEqual(ENEMY_SKILLS.easy)
      expect(bs.phase).toBe('player-action')
      expect(bs.result).toBeNull()
      expect(bs.log).toEqual([])
    })

    it('난이도별 적 데이터 반영', () => {
      useBattleStore.getState().initBattle('용사', playerStats, playerSkills, 'hard')
      const bs = useBattleStore.getState().battleState!
      expect(bs.enemy.name).toBe(ENEMY_NAMES.hard)
      expect(bs.enemy.baseStats).toEqual(ENEMY_STATS.hard)
    })

    it('difficulty 상태 저장', () => {
      useBattleStore.getState().initBattle('용사', playerStats, playerSkills, 'normal')
      expect(useBattleStore.getState().difficulty).toBe('normal')
    })
  })

  // ─── executePlayerAction ───────────────────────────────
  describe('executePlayerAction', () => {
    beforeEach(() => {
      useBattleStore.getState().initBattle('용사', playerStats, playerSkills, 'easy')
    })

    it('기본 공격 실행 → 큐에 2개 항목 (선공+후공)', () => {
      useBattleStore.getState().executePlayerAction({ type: 'attack' })
      const state = useBattleStore.getState()

      // 큐에 항목이 있어야 함 (선공 + 후공 = 2)
      expect(state.actionQueue.length).toBe(2)
      // 로그에 2개 엔트리
      expect(state.battleState!.log.length).toBe(2)
    })

    it('방어 실행', () => {
      useBattleStore.getState().executePlayerAction({ type: 'defend' })
      const state = useBattleStore.getState()
      expect(state.actionQueue.length).toBe(2)
    })

    it('스킬 실행 (MP 충분)', () => {
      useBattleStore.getState().executePlayerAction({ type: 'skill', skillId: 'fire-slash' })
      const state = useBattleStore.getState()
      expect(state.actionQueue.length).toBe(2)
      // 플레이어 MP가 감소해야 함
      expect(state.battleState!.player.currentMp).toBeLessThan(playerStats.mp)
    })

    it('존재하지 않는 스킬 → 아무 동작 안 함', () => {
      const before = useBattleStore.getState().battleState
      useBattleStore.getState().executePlayerAction({ type: 'skill', skillId: 'nonexistent' })
      const after = useBattleStore.getState().battleState
      expect(after).toEqual(before)
    })

    it('MP 부족 시 스킬 사용 불가 → 아무 동작 안 함', () => {
      // MP를 0으로 강제 설정
      const bs = useBattleStore.getState().battleState!
      useBattleStore.setState({
        battleState: { ...bs, player: { ...bs.player, currentMp: 0 } },
      })
      const before = useBattleStore.getState().battleState
      useBattleStore.getState().executePlayerAction({ type: 'skill', skillId: 'fire-slash' })
      const after = useBattleStore.getState().battleState
      expect(after).toEqual(before)
    })

    it('result가 있으면 액션 무시', () => {
      // 전투 종료 상태를 임의로 설정
      const bs = useBattleStore.getState().battleState!
      useBattleStore.setState({
        battleState: { ...bs, result: 'victory' },
      })
      useBattleStore.getState().executePlayerAction({ type: 'attack' })
      // 큐가 비어있어야 (추가 안 됨)
      expect(useBattleStore.getState().actionQueue).toEqual([])
    })

    it('라운드 진행 시 round 증가', () => {
      useBattleStore.getState().executePlayerAction({ type: 'attack' })
      const bs = useBattleStore.getState().battleState!
      // 한쪽이 죽지 않았다면 round가 2여야 함
      if (!bs.result) {
        expect(bs.round).toBe(2)
      }
    })
  })

  // ─── processQueue ──────────────────────────────────────
  describe('processQueue', () => {
    it('큐에서 항목 순차 소비', () => {
      useBattleStore.getState().initBattle('용사', playerStats, playerSkills, 'easy')
      useBattleStore.getState().executePlayerAction({ type: 'attack' })

      const first = useBattleStore.getState().processQueue()
      expect(first).not.toBeNull()
      expect(first!.logEntry).toBeDefined()

      const second = useBattleStore.getState().processQueue()
      expect(second).not.toBeNull()

      const third = useBattleStore.getState().processQueue()
      expect(third).toBeNull()
    })

    it('빈 큐에서 null 반환', () => {
      expect(useBattleStore.getState().processQueue()).toBeNull()
    })
  })

  // ─── getResult ─────────────────────────────────────────
  describe('getResult', () => {
    it('전투 중에는 null', () => {
      useBattleStore.getState().initBattle('용사', playerStats, playerSkills, 'easy')
      expect(useBattleStore.getState().getResult()).toBeNull()
    })

    it('result 설정 후 반환', () => {
      useBattleStore.getState().initBattle('용사', playerStats, playerSkills, 'easy')
      const bs = useBattleStore.getState().battleState!
      useBattleStore.setState({
        battleState: { ...bs, result: 'victory', round: 5 },
      })
      const result = useBattleStore.getState().getResult()
      expect(result).toEqual({ result: 'victory', totalRounds: 5 })
    })
  })

  // ─── reset ─────────────────────────────────────────────
  describe('reset', () => {
    it('모든 전투 상태 초기화', () => {
      useBattleStore.getState().initBattle('용사', playerStats, playerSkills, 'easy')
      useBattleStore.getState().executePlayerAction({ type: 'attack' })
      useBattleStore.getState().reset()

      const s = useBattleStore.getState()
      expect(s.battleState).toBeNull()
      expect(s.difficulty).toBeNull()
      expect(s.actionQueue).toEqual([])
    })
  })

  // ─── 전투 종료 시나리오 ────────────────────────────────
  describe('전투 종료', () => {
    it('적 HP가 0 이하면 victory', () => {
      // 높은 ATK로 적을 빨리 처치
      const highAtkStats: Stats = { hp: 60, mp: 40, atk: 30, def: 15, spd: 15 }
      useBattleStore.getState().initBattle('용사', highAtkStats, playerSkills, 'easy')

      // 여러 라운드 실행
      for (let i = 0; i < 20; i++) {
        const bs = useBattleStore.getState().battleState
        if (bs?.result) break
        useBattleStore.getState().executePlayerAction({ type: 'attack' })
      }

      const result = useBattleStore.getState().getResult()
      // 높은 ATK vs easy 적이면 승리해야 함
      expect(result).not.toBeNull()
      expect(result!.result).toBe('victory')
    })

    it('플레이어 HP가 0 이하면 defeat', () => {
      // 낮은 HP + 낮은 DEF vs hard 적
      const weakStats: Stats = { hp: 20, mp: 40, atk: 5, def: 5, spd: 5 }
      useBattleStore.getState().initBattle('약자', weakStats, DEFAULT_SKILLS, 'hard')

      for (let i = 0; i < 20; i++) {
        const bs = useBattleStore.getState().battleState
        if (bs?.result) break
        useBattleStore.getState().executePlayerAction({ type: 'attack' })
      }

      const result = useBattleStore.getState().getResult()
      expect(result).not.toBeNull()
      expect(result!.result).toBe('defeat')
    })

    it('후공의 공격으로 사망 → 후공 후 사망 분기', () => {
      // 플레이어 선공, 적 후공인 상태에서 적의 후공 공격으로 플레이어 사망
      // 적 HP를 높게, 플레이어 HP를 낮게 설정 → 선공(플레이어)에서는 적이 안 죽고, 후공(적)에서 플레이어가 죽음
      const lowHpStats: Stats = { hp: 30, mp: 40, atk: 5, def: 5, spd: 15 }
      useBattleStore.getState().initBattle('유리', lowHpStats, DEFAULT_SKILLS, 'hard')
      // 플레이어 SPD 15 > hard 적 SPD 14 → 플레이어 선공
      const bs = useBattleStore.getState().battleState!
      expect(bs.isPlayerFirst).toBe(true)

      // 여러 라운드 실행 — 선공(플레이어)은 ATK 5로 거의 피해 못 주고, 후공(적) ATK 20이 플레이어를 사망시킴
      for (let i = 0; i < 20; i++) {
        const current = useBattleStore.getState().battleState
        if (current?.result) break
        useBattleStore.getState().executePlayerAction({ type: 'attack' })
      }

      const result = useBattleStore.getState().getResult()
      expect(result).not.toBeNull()
      // 플레이어 ATK 5 vs 적 DEF 16 → 최소 데미지 1, 적 HP 140이라 안 죽음
      // 적 ATK 20 vs 플레이어 DEF 5 → ~17.5 데미지, 플레이어 HP 30이라 2라운드면 사망
      expect(result!.result).toBe('defeat')
    })

    it('20라운드 초과 시 무승부', () => {
      // 양쪽 모두 높은 HP + 높은 DEF + 낮은 ATK → 서로 못 죽임
      const tankStats: Stats = { hp: 100, mp: 20, atk: 5, def: 30, spd: 15 }
      useBattleStore.getState().initBattle('탱커', tankStats, DEFAULT_SKILLS, 'easy')

      for (let i = 0; i < 25; i++) {
        const bs = useBattleStore.getState().battleState
        if (bs?.result) break
        useBattleStore.getState().executePlayerAction({ type: 'attack' })
      }

      const result = useBattleStore.getState().getResult()
      expect(result).not.toBeNull()
      expect(result!.result).toBe('draw')
    })
  })

  // ─── 적 선공 시나리오 (isPlayerFirst === false) ───────
  describe('적 선공', () => {
    it('적 SPD > 플레이어 SPD → 적이 선공', () => {
      // 플레이어 SPD 5 vs easy 적 SPD 7 → 적 선공
      const slowStats: Stats = { hp: 60, mp: 40, atk: 20, def: 15, spd: 5 }
      useBattleStore.getState().initBattle('느림이', slowStats, playerSkills, 'easy')
      const bs = useBattleStore.getState().battleState!
      expect(bs.isPlayerFirst).toBe(false)

      useBattleStore.getState().executePlayerAction({ type: 'attack' })
      const state = useBattleStore.getState()
      expect(state.actionQueue.length).toBe(2)
      // 첫 번째 큐 아이템은 적의 행동
      expect(state.actionQueue[0].actor).toBe('enemy')
    })
  })

  // ─── 힐/버프 스킬 큐 타입 ────────────────────────────
  describe('힐/버프/디버프 큐 타입', () => {
    it('힐 스킬 사용 → 큐 아이템 type이 heal', () => {
      const healSkills: Skill[] = [
        ...DEFAULT_SKILLS,
        { id: 'heal-light', name: '치유', type: 'heal', mpCost: 10, healAmount: 20, isDefault: false },
      ]
      useBattleStore.getState().initBattle('힐러', playerStats, healSkills, 'easy')
      useBattleStore.getState().executePlayerAction({ type: 'skill', skillId: 'heal-light' })

      const { actionQueue, battleState } = useBattleStore.getState()
      const healItem = actionQueue.find((q) => q.type === 'heal')
      expect(healItem).toBeDefined()
      expect(battleState!.log.some((e) => e.skillType === 'heal')).toBe(true)
    })

    it('버프 스킬 사용 → 큐 아이템 type이 buff', () => {
      const buffSkills: Skill[] = [
        ...DEFAULT_SKILLS,
        { id: 'power-up', name: '기합', type: 'buff', mpCost: 8, targetStat: 'atk', amount: 5, duration: 3, isDefault: false },
      ]
      useBattleStore.getState().initBattle('버퍼', playerStats, buffSkills, 'easy')
      useBattleStore.getState().executePlayerAction({ type: 'skill', skillId: 'power-up' })

      const { actionQueue } = useBattleStore.getState()
      const buffItem = actionQueue.find((q) => q.type === 'buff')
      expect(buffItem).toBeDefined()
    })

    it('디버프 스킬 사용 → 큐 아이템 type이 debuff', () => {
      const debuffSkills: Skill[] = [
        ...DEFAULT_SKILLS,
        { id: 'weaken', name: '약화', type: 'debuff', mpCost: 8, targetStat: 'def', amount: 3, duration: 2, isDefault: false },
      ]
      useBattleStore.getState().initBattle('디버퍼', playerStats, debuffSkills, 'easy')
      useBattleStore.getState().executePlayerAction({ type: 'skill', skillId: 'weaken' })

      const { actionQueue } = useBattleStore.getState()
      const debuffItem = actionQueue.find((q) => q.type === 'debuff')
      expect(debuffItem).toBeDefined()
    })
  })
})
