import { create } from 'zustand';

interface LocationState {
  location: 'salem' | 'portland';
  setLocation: (loc: 'salem' | 'portland') => void;
}

export const useLocationState = create<LocationState>((set) => ({
  location: 'salem',
  setLocation: (loc: 'salem' | 'portland') => set({ location: loc }),
})); 