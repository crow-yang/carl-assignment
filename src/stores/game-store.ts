import { create } from 'zustand'
import type { GamePhase } from '../types'

interface GameState {
  phase: GamePhase
  setPhase: (phase: GamePhase) => void
  reset: () => void
}

export const useGameStore = create<GameState>((set) => ({
  phase: 'setup',
  setPhase: (phase) => set({ phase }),
  reset: () => set({ phase: 'setup' }),
}))
