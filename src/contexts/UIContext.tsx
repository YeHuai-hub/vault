import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

type Theme = "dark" | "light";

interface UIContextType {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  activeCategory: number | null;
  setActiveCategory: (id: number | null) => void;
  activeTag: number | null;
  setActiveTag: (id: number | null) => void;
  favoritesOnly: boolean;
  setFavoritesOnly: (v: boolean) => void;
  detailOpen: boolean;
  setDetailOpen: (open: boolean) => void;
  toast: string | null;
  toastAction: { label: string; onClick: () => void } | null;
  showToast: (msg: string, action?: { label: string; onClick: () => void }) => void;
  theme: Theme;
  setTheme: (t: Theme) => void;
  autoLockMinutes: number;
  setAutoLockMinutes: (m: number) => void;
  tagRefreshKey: number;
  refreshTags: () => void;
  dataRefreshKey: number;
  refreshData: () => void;
}

const UIContext = createContext<UIContextType | null>(null);

export function UIProvider({ children }: { children: ReactNode }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<number | null>(null);
  const [activeTag, setActiveTag] = useState<number | null>(null);
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [toastAction, setToastAction] = useState<{ label: string; onClick: () => void } | null>(null);
  const [theme, setThemeState] = useState<Theme>("dark");
  const [autoLockMinutes, setAutoLockMinutes] = useState(5);
  const [tagRefreshKey, setTagRefreshKey] = useState(0);
  const refreshTags = () => { setTagRefreshKey(k => k + 1); };
  const [dataRefreshKey, setDataRefreshKey] = useState(0);
  const refreshData = () => { setTagRefreshKey(k => k + 1); setDataRefreshKey(k => k + 1); };

  const showToast = (msg: string, action?: { label: string; onClick: () => void }) => { setToast(msg); setToastAction(action || null); setTimeout(() => { setToast(null); setToastAction(null); }, action ? 5000 : 3000); };

  const setTheme = (t: Theme) => {
    setThemeState(t);
    document.documentElement.className = t;
    localStorage.setItem("vault-theme", t);
  };

  useEffect(() => {
    const saved = localStorage.getItem("vault-theme") as Theme | null;
    if (saved === "light" || saved === "dark") setTheme(saved);
  }, []);

  return (
    <UIContext.Provider value={{
      searchQuery, setSearchQuery,
      activeCategory, setActiveCategory,
      activeTag, setActiveTag,
      favoritesOnly, setFavoritesOnly,
      detailOpen, setDetailOpen,
      toast, toastAction, showToast,
      theme, setTheme,
      autoLockMinutes, setAutoLockMinutes,
      tagRefreshKey, refreshTags,
      dataRefreshKey, refreshData,
    }}>
      {children}
    </UIContext.Provider>
  );
}

export function useUI() {
  const ctx = useContext(UIContext);
  if (!ctx) throw new Error("useUI must be used within UIProvider");
  return ctx;
}
