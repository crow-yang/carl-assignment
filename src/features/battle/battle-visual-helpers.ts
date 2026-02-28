import type { ActionQueueItem } from '../../types'

export type VisualEffect = 'hit-flash' | 'pulse-heal' | 'shake' | null

/**
 * 큐 아이템 기준으로 해당 side의 패널에 데미지/힐 팝업을 표시할지 결정.
 *
 * 표시 규칙:
 *   - damage: 대상(target) 패널에 표시 → actor 반대편
 *   - heal:   시전자(actor) 패널에 표시 → actor 본인
 *   - defend/buff/debuff: 팝업 없음
 */
export function shouldShowPopup(
  item: ActionQueueItem | null,
  side: 'player' | 'enemy',
): boolean {
  if (!item) return false

  switch (item.type) {
    case 'damage':
      // 공격 대상의 패널에 표시 (actor의 반대편)
      return item.actor !== side
    case 'heal':
      // 힐은 시전자 패널에 표시
      return item.actor === side
    case 'defend':
    case 'buff':
    case 'debuff':
    case 'effect-expire':
      return false
  }
}

/**
 * 큐 아이템 기준으로 해당 side의 패널에 적용할 CSS 애니메이션 이펙트 결정.
 *
 * 이펙트 규칙:
 *   - damage → 대상 패널: shake + hit-flash
 *   - heal   → 시전자 패널: pulse-heal
 *   - defend/buff/debuff: 이펙트 없음
 */
export function getActiveEffect(
  item: ActionQueueItem | null,
  side: 'player' | 'enemy',
): VisualEffect {
  if (!item) return null

  switch (item.type) {
    case 'damage':
      // 피격 대상에게 shake 적용
      return item.actor !== side ? 'shake' : null
    case 'heal':
      // 힐 시전자에게 pulse-heal 적용
      return item.actor === side ? 'pulse-heal' : null
    case 'defend':
    case 'buff':
    case 'debuff':
    case 'effect-expire':
      return null
  }
}

/** 팝업에 표시할 텍스트와 색상 클래스 */
export function getPopupDisplay(item: ActionQueueItem): { text: string; colorClass: string } {
  switch (item.type) {
    case 'damage':
      return { text: `-${item.value ?? 0}`, colorClass: 'text-red-400' }
    case 'heal':
      return { text: `+${item.value ?? 0}`, colorClass: 'text-green-400' }
    case 'defend':
    case 'buff':
    case 'debuff':
    case 'effect-expire':
      return { text: '', colorClass: '' }
  }
}
