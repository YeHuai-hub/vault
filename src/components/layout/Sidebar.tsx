import { useState } from "react";
import { useVault } from "../../contexts/VaultContext";
import { useUI } from "../../contexts/UIContext";
import { useEntries } from "../../contexts/EntryContext";
import SearchBar from "../search/SearchBar";
import CategoryList from "../categories/CategoryList";
import SettingsDialog from "../shared/SettingsDialog";

export default function Sidebar() {
  const { lockVault } = useVault();
  const { searchQuery, showToast, setDetailOpen, favoritesOnly, setFavoritesOnly, activeCategory, activeTag } = useUI();
  const { selectEntry, loadEntries } = useEntries();
  const [showSettings, setShowSettings] = useState(false);

  const handleNewEntry = () => { selectEntry({ id: "", category_id: null, category_name: null, title: "", website: "", username: "", password: "", notes: "", custom_fields: [], is_favorite: false, created_at: "", updated_at: "", tags: [], tag_ids: [] }); setDetailOpen(true); };
  const handleLock = async () => { try { await lockVault(); showToast("已锁定"); } catch (e) { showToast(String(e)); } };
  const handleRefresh = () => { loadEntries({ categoryId: activeCategory ?? undefined, search: searchQuery || undefined, tagId: activeTag ?? undefined }); showToast("已刷新"); };

  return (
    <div className="w-60 flex-shrink-0 bg-neutral-950 border-r border-gray-800 flex flex-col h-full text-sm">
      <div className="p-2.5 border-b border-gray-800">
        <div className="flex items-center justify-between mb-2">
          <span className="font-semibold text-white text-sm">Vault</span>
          <div className="flex gap-0.5">
            <button onClick={handleRefresh} className="p-1 text-gray-500 hover:text-gray-300" title="刷新"><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg></button>
            <button onClick={handleNewEntry} className="p-1 text-gray-500 hover:text-white" title="新建"><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg></button>
            <button onClick={() => setShowSettings(true)} className="p-1 text-gray-500 hover:text-gray-300" title="设置"><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg></button>
            <button onClick={handleLock} className="p-1 text-gray-500 hover:text-red-400" title="锁定"><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg></button>
          </div>
        </div>
        <SearchBar />
      </div>

      <div className="px-2.5 py-1.5 border-b border-gray-800">
        <button onClick={() => setFavoritesOnly(!favoritesOnly)} className={`w-full text-left px-2 py-1 text-sm ${favoritesOnly ? "bg-white/10 text-white" : "text-gray-400 hover:text-gray-200 hover:bg-neutral-900"}`}>
          <span className={favoritesOnly ? "text-yellow-400" : "text-gray-500"}>★</span> 收藏
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2.5"><CategoryList /></div>

      <div className="p-2 border-t border-gray-800 text-xs text-gray-700 text-center">
        Ctrl+N 新建 &middot; Ctrl+F 搜索 &middot; Ctrl+L 锁定
      </div>

      {showSettings && <SettingsDialog onClose={() => setShowSettings(false)} />}
    </div>
  );
}
