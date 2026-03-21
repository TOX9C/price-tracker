import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Appearance } from 'react-native';

type ThemeMode = 'light' | 'dark' | 'system';

interface UIState {
  themeMode: ThemeMode;
  isDark: boolean;
  setThemeMode: (mode: ThemeMode) => void;
}

const getSystemTheme = (): boolean => {
  return Appearance.getColorScheme() === 'dark';
};

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      themeMode: 'system',
      isDark: getSystemTheme(),
      setThemeMode: (mode) => {
        const isDark = mode === 'system' ? getSystemTheme() : mode === 'dark';
        set({ themeMode: mode, isDark });
      },
    }),
    {
      name: 'ui-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ themeMode: state.themeMode }),
    }
  )
);

// Listen to system theme changes
if (Appearance) {
  Appearance.addChangeListener(({ colorScheme }) => {
    const state = useUIStore.getState();
    if (state.themeMode === 'system') {
      useUIStore.setState({ isDark: colorScheme === 'dark' });
    }
  });
}
