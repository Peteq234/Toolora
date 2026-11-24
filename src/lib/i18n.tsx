import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type Language = "en" | "pl";

type Dictionary = Record<string, string>;

const EN: Dictionary = {
  "nav.tools": "All tools",
  "nav.about": "About",
  "nav.contact": "Contact",
  "nav.favorites": "Favorites",
  "nav.browse": "Browse tools",
  "nav.search": "Search tools",
  "nav.freeTools": "free tools",
  "nav.language": "Language",
  "search.placeholder": "Search tools and suites…",
  "suites.eyebrow": "Organised suites",
  "suites.heading": "Tool suites",
  "suites.description": "Related tools share a tabbed workspace. Individual tools keep their own pages, bookmarks and search results — nothing moves or breaks.",
  "suites.search": "Find a suite or a function…",
  "directory.tools": "tools",
  "footer.popular": "Popular tools",
  "footer.categories": "Categories",
  "footer.company": "Toolora",
  "footer.install": "Install Toolora",
  "footer.privacy": "Privacy policy",
  "footer.terms": "Terms of use",
  "footer.admin": "Admin sign-in",
  "common.openSuite": "Open suite",
  "common.allTools": "All tools",
  "common.copyLink": "Copy link",
  "common.save": "Save",
  "common.saved": "Saved",
  "common.local": "Runs locally",
  "common.free": "Free",
  "common.clear": "Clear",
  "common.download": "Download",
};

const PL: Dictionary = {
  "nav.tools": "Wszystkie narzędzia",
  "nav.about": "O nas",
  "nav.contact": "Kontakt",
  "nav.favorites": "Ulubione",
  "nav.browse": "Przeglądaj narzędzia",
  "nav.search": "Szukaj narzędzi",
  "nav.freeTools": "darmowych narzędzi",
  "nav.language": "Język",
  "search.placeholder": "Szukaj narzędzi i zestawów…",
  "suites.eyebrow": "Zorganizowane zestawy",
  "suites.heading": "Zestawy narzędzi",
  "suites.description": "Powiązane narzędzia mają wspólną przestrzeń z kartami. Każde narzędzie zachowuje własną stronę, zakładki i wyniki wyszukiwania — nic nie znika.",
  "suites.search": "Znajdź zestaw lub funkcję…",
  "directory.tools": "narzędzi",
  "footer.popular": "Popularne narzędzia",
  "footer.categories": "Kategorie",
  "footer.company": "Toolora",
  "footer.install": "Zainstaluj Toolorę",
  "footer.privacy": "Polityka prywatności",
  "footer.terms": "Warunki korzystania",
  "footer.admin": "Panel administratora",
  "common.openSuite": "Otwórz zestaw",
  "common.allTools": "Wszystkie narzędzia",
  "common.copyLink": "Kopiuj link",
  "common.save": "Zapisz",
  "common.saved": "Zapisano",
  "common.local": "Działa lokalnie",
  "common.free": "Bezpłatnie",
  "common.clear": "Wyczyść",
  "common.download": "Pobierz",
};

const DICTIONARIES: Record<Language, Dictionary> = { en: EN, pl: PL };
const STORAGE_KEY = "toolora:language";
const LanguageContext = createContext<{ language: Language; setLanguage: (language: Language) => void; t: (key: string, fallback?: string) => string } | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window === "undefined") return "en";
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored === "en" || stored === "pl") return stored;
    } catch { /* ignore */ }
    return "en";
  });

  useEffect(() => {
    try { window.localStorage.setItem(STORAGE_KEY, language); } catch { /* ignore */ }
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = useCallback((next: Language) => setLanguageState(next), []);
  const t = useCallback((key: string, fallback?: string) => DICTIONARIES[language][key] ?? fallback ?? DICTIONARIES.en[key] ?? key, [language]);
  const value = useMemo(() => ({ language, setLanguage, t }), [language, setLanguage, t]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const value = useContext(LanguageContext);
  if (!value) throw new Error("useLanguage must be used inside LanguageProvider");
  return value;
}
