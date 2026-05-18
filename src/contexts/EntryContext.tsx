import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { invoke } from "../lib/invoke";
import type { Entry, CreateEntry, UpdateEntry } from "../types";

interface EntryContextType {
  entries: Entry[];
  selectedEntry: Entry | null;
  isLoading: boolean;
  loadEntries: (params?: {
    categoryId?: number;
    search?: string;
    tagId?: number;
  }) => Promise<void>;
  getEntry: (id: string) => Promise<Entry>;
  createEntry: (entry: CreateEntry) => Promise<Entry>;
  updateEntry: (id: string, entry: UpdateEntry) => Promise<Entry>;
  deleteEntry: (id: string) => Promise<void>;
  toggleFavorite: (id: string) => Promise<Entry>;
  selectEntry: (entry: Entry | null) => void;
}

const EntryContext = createContext<EntryContextType | null>(null);

export function EntryProvider({ children }: { children: ReactNode }) {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<Entry | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const loadEntries = useCallback(
    async (params?: { categoryId?: number; search?: string; tagId?: number }) => {
      setIsLoading(true);
      try {
        const result = await invoke<Entry[]>("list_entries", {
          categoryId: params?.categoryId ?? null,
          search: params?.search ?? null,
          tagId: params?.tagId ?? null,
        });
        setEntries(result);
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const getEntry = useCallback(async (id: string) => {
    return invoke<Entry>("get_entry", { id });
  }, []);

  const createEntry = useCallback(async (entry: CreateEntry) => {
    const result = await invoke<Entry>("create_entry", { entry });
    return result;
  }, []);

  const updateEntry = useCallback(async (id: string, entry: UpdateEntry) => {
    const result = await invoke<Entry>("update_entry", { id, entry });
    return result;
  }, []);

  const deleteEntry = useCallback(async (id: string) => {
    await invoke("delete_entry", { id });
  }, []);

  const toggleFavorite = useCallback(async (id: string) => {
    const result = await invoke<Entry>("toggle_favorite", { id });
    return result;
  }, []);

  const selectEntry = useCallback((entry: Entry | null) => {
    setSelectedEntry(entry);
  }, []);

  return (
    <EntryContext.Provider
      value={{
        entries,
        selectedEntry,
        isLoading,
        loadEntries,
        getEntry,
        createEntry,
        updateEntry,
        deleteEntry,
        toggleFavorite,
        selectEntry,
      }}
    >
      {children}
    </EntryContext.Provider>
  );
}

export function useEntries() {
  const ctx = useContext(EntryContext);
  if (!ctx) throw new Error("useEntries must be used within EntryProvider");
  return ctx;
}
