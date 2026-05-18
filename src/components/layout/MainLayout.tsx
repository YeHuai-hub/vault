import { useEffect } from "react";
import Sidebar from "./Sidebar";
import EntryList from "../entries/EntryList";
import EntryForm from "../entries/EntryForm";
import { useUI } from "../../contexts/UIContext";
import { useEntries } from "../../contexts/EntryContext";
import { useVault } from "../../contexts/VaultContext";
import { useAutolock } from "../../hooks/useAutolock";

export default function MainLayout() {
  const { detailOpen, setDetailOpen, autoLockMinutes } = useUI();
  const { selectedEntry, selectEntry } = useEntries();
  const { state, lockVault } = useVault();
  const isLocked = state.status !== "unlocked";

  useAutolock(isLocked, autoLockMinutes, lockVault);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey;
      if (mod && e.key === "l") { e.preventDefault(); lockVault().catch(() => {}); }
      if (mod && e.key === "n") { e.preventDefault(); selectEntry({ id: "", category_id: null, category_name: null, title: "", website: "", username: "", password: "", notes: "", custom_fields: [], is_favorite: false, created_at: "", updated_at: "", tags: [], tag_ids: []}); setDetailOpen(true); }
      if (mod && e.key === "f") { e.preventDefault(); document.querySelector<HTMLInputElement>('input[placeholder="搜索..."]')?.focus(); }
      if (e.key === "Escape") selectEntry(null);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [lockVault, selectEntry, setDetailOpen]);

  return (
    <div className="h-full flex bg-gh-bg">
      <Sidebar />
      <EntryList />
      {detailOpen && selectedEntry && <EntryForm />}
    </div>
  );
}
