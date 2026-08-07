import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useMemo } from 'react';
import { makeL, type Lang } from './dict';

interface LanguageState {
  lang: Lang;
  setLang: (lang: Lang) => void;
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set) => ({
      lang: 'en',
      setLang: (lang) => set({ lang }),
    }),
    {
      name: 'gcsubhub-lang',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

/** Returns the `L("key")` translator bound to the current language, mirroring the prototype's `L` helper. */
export function useL() {
  const lang = useLanguageStore((s) => s.lang);
  return useMemo(() => makeL(lang), [lang]);
}
