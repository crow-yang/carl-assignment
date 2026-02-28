import type { ActionQueueItem } from '../types'

/**
 * 액션 큐: 전투 라운드 결과를 큐에 적재하고 UI가 순차 소비하는 패턴.
 *
 * 흐름:
 *   1. 라운드 로직 실행 → 결과를 enqueue()로 큐에 적재
 *   2. UI가 dequeue()로 하나씩 꺼내며 연출
 *   3. 큐가 비면 다음 라운드 대기
 *
 * 모든 함수는 순수(불변). 원본 큐를 변경하지 않음.
 */

export function createQueue(): ActionQueueItem[] {
  return []
}

export function enqueue(queue: ActionQueueItem[], item: ActionQueueItem): ActionQueueItem[] {
  return [...queue, item]
}

export function enqueueAll(queue: ActionQueueItem[], items: ActionQueueItem[]): ActionQueueItem[] {
  return [...queue, ...items]
}

export function dequeue(queue: ActionQueueItem[]): {
  item: ActionQueueItem | null
  remaining: ActionQueueItem[]
} {
  if (queue.length === 0) {
    return { item: null, remaining: [] }
  }
  const [item, ...remaining] = queue
  return { item, remaining }
}

export function isQueueEmpty(queue: ActionQueueItem[]): boolean {
  return queue.length === 0
}

export function queueSize(queue: ActionQueueItem[]): number {
  return queue.length
}
