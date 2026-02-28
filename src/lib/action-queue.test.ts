import { describe, it, expect } from 'vitest'
import { createQueue, enqueue, enqueueAll, dequeue, isQueueEmpty, queueSize } from './action-queue'
import type { ActionQueueItem, TurnLogEntry, Character } from '../types'

const stubCharacter: Character = {
  name: '용사',
  baseStats: { hp: 100, mp: 50, atk: 20, def: 15, spd: 15 },
  currentHp: 100,
  currentMp: 50,
  skills: [],
  activeEffects: [],
}

function makeItem(description: string): ActionQueueItem {
  const logEntry: TurnLogEntry = {
    round: 1,
    actor: 'player',
    actorName: '용사',
    skillType: 'attack',
    action: description,
  }
  return {
    type: 'damage',
    actor: 'player',
    actorName: '용사',
    description,
    value: 10,
    logEntry,
    playerSnapshot: stubCharacter,
    enemySnapshot: stubCharacter,
  }
}

describe('createQueue', () => {
  it('빈 큐 생성', () => {
    const q = createQueue()
    expect(q).toHaveLength(0)
    expect(isQueueEmpty(q)).toBe(true)
  })
})

describe('enqueue', () => {
  it('아이템 추가', () => {
    const q = enqueue(createQueue(), makeItem('공격'))
    expect(queueSize(q)).toBe(1)
  })

  it('원본 불변', () => {
    const original = createQueue()
    enqueue(original, makeItem('공격'))
    expect(original).toHaveLength(0)
  })
})

describe('enqueueAll', () => {
  it('여러 아이템 한번에 추가', () => {
    const q = enqueueAll(createQueue(), [makeItem('공격'), makeItem('방어')])
    expect(queueSize(q)).toBe(2)
  })
})

describe('dequeue', () => {
  it('FIFO 순서로 꺼냄', () => {
    const q = enqueueAll(createQueue(), [makeItem('첫번째'), makeItem('두번째')])
    const r1 = dequeue(q)
    expect(r1.item?.description).toBe('첫번째')
    expect(r1.remaining).toHaveLength(1)

    const r2 = dequeue(r1.remaining)
    expect(r2.item?.description).toBe('두번째')
    expect(r2.remaining).toHaveLength(0)
  })

  it('빈 큐에서 dequeue → null', () => {
    const r = dequeue(createQueue())
    expect(r.item).toBeNull()
    expect(r.remaining).toHaveLength(0)
  })

  it('원본 불변', () => {
    const q = enqueue(createQueue(), makeItem('공격'))
    dequeue(q)
    expect(q).toHaveLength(1)
  })
})

describe('isQueueEmpty / queueSize', () => {
  it('빈 큐', () => {
    expect(isQueueEmpty(createQueue())).toBe(true)
    expect(queueSize(createQueue())).toBe(0)
  })

  it('아이템 있는 큐', () => {
    const q = enqueue(createQueue(), makeItem('공격'))
    expect(isQueueEmpty(q)).toBe(false)
    expect(queueSize(q)).toBe(1)
  })
})
