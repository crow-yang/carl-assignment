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
      className={`absolute -top-2 left-1/2 -translate-x-1/2 text-xl font-black animate-float-up pointer-events-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] ${colorClass}`}
    >
      {text}
    </div>
  )
}
