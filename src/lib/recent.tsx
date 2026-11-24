import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

const STORAGE_KEY = "toolora:recent:v1";
const LIMIT = 6;

type RecentValue = {
  recents: string[];
  recordRecent: (slug: string) => void;
  removeRecent: (slug: string) => void;
  clearRecent: () => void;
};

const RecentContext = createContext<RecentValue | null>(null);

function readStored(): string[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is string => typeof item === "string").slice(0, LIMIT);
  } catch {
    return [];
  }
}

export function RecentProvider({ children }: { children: ReactNode }) {
  const [recents, setRecents] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    return readStored();
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(recents.slice(0, LIMIT)));
    } catch {
      /* storage may be unavailable — recents simply stay in memory */
    }
  }, [recents]);

  useEffect(() => {
    function onStorage(event: StorageEvent) {
      if (event.key === STORAGE_KEY) setRecents(readStored());
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const recordRecent = useCallback((slug: string) => {
    setRecents((current) => [slug, ...current.filter((item) => item !== slug)].slice(0, LIMIT));
  }, []);

  const removeRecent = useCallback((slug: string) => {
    setRecents((current) => current.filter((item) => item !== slug));
  }, []);

  const clearRecent = useCallback(() => setRecents([]), []);

  const value = useMemo(
    () => ({ recents, recordRecent, removeRecent, clearRecent }),
    [recents, recordRecent, removeRecent, clearRecent]
  );

  return <RecentContext.Provider value={value}>{children}</RecentContext.Provider>;
}

export function useRecent(): RecentValue {
  const value = useContext(RecentContext);
  if (!value) throw new Error("useRecent must be used inside RecentProvider");
  return value;
}
