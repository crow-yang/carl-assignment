import type { ActionQueueItem } from '../../types'
import { shouldShowPopup, getPopupDisplay } from './battle-visual-helpers'

interface DamagePopupProps {
  item: ActionQueueItem | null
  side: 'player' | 'enemy'
}

export function DamagePopup({ item, side }: DamagePopupProps) {
  if (!item || !shouldShowPopup(item, side)) return null

  const { text, colorClass } = getPopupDisplay(item)
  if (!text) return null

  return (
    <div
      key={`${item.actor}-${item.type}-${item.value}`}
      className={`absolute -top-2 left-1/2 -translate-x-1/2 text-lg font-bold animate-float-up pointer-events-none ${colorClass}`}
    >
      {text}
    </div>
  )
}
