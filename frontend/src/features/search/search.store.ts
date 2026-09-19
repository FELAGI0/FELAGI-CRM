import { create } from 'zustand'

type SearchState = {
  isOpen: boolean
  open: () => void
  close: () => void
  toggle: () => void
}

/**
 * Not persisted: the palette should never reopen on a page load, and the query
 * itself lives in the modal so it resets naturally on unmount.
 */
export const useSearchStore = create<SearchState>()((set) => ({
  isOpen: false,
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
  toggle: () => set((state) => ({ isOpen: !state.isOpen })),
}))