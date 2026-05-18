import { useEffect, useState, useRef } from "react";
import { useEntries } from "../../contexts/EntryContext";
import { useUI } from "../../contexts/UIContext";
import EntryCard from "./EntryCard";
import ConfirmDialog from "../shared/ConfirmDialog";
import { invoke } from "../../lib/invoke";
import { useDebounce } from "../../hooks/useDebounce";

export default function EntryList() {
  const { entries, isLoading, loadEntries } = useEntries();
  const { searchQuery, activeCategory, activeTag, favoritesOnly, tagRefreshKey, showToast } = useUI();
  const debouncedSearch = useDebounce(searchQuery, 200);

  useEffect(() => {
    loadEntries({ categoryId: activeCategory ?? undefined, search: debouncedSearch || undefined, tagId: activeTag ?? undefined });
  }, [debouncedSearch, activeCategory, activeTag, loadEntries, tagRefreshKey]);

  const displayed = favoritesOnly ? entries.filter((e) => e.is_favorite) : entries;

  // Batch select
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showBatchDelete, setShowBatchDelete] = useState(false);
  const [batchCategory, setBatchCategory] = useState<number | null>(null);
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);

  useEffect(() => { invoke<{ id: number; name: string }[]>("list_categories").then(setCategories).catch(() => {}); }, []);

  const toggleSelect = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelected(next);
  };
  const selectAll = () => {
    if (selected.size === displayed.length) { setSelected(new Set()); setSelectMode(false); }
    else setSelected(new Set(displayed.map((e) => e.id)));
  };
  const exitSelect = () => { setSelectMode(false); setSelected(new Set()); };

  const batchDeleteTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleBatchDelete = () => {
    const ids = [...selected];
    const count = ids.length;
    exitSelect();
    batchDeleteTimer.current = setTimeout(async () => {
      try { await invoke("batch_delete", { ids }); loadEntries(); showToast(`已删除 ${count} 条`); }
      catch (e) { showToast(String(e)); }
    }, 5000);
    showToast(`已删除 ${count} 条`, { label: "撤销", onClick: () => {
      if (batchDeleteTimer.current) { clearTimeout(batchDeleteTimer.current); batchDeleteTimer.current = null; }
      showToast("已撤销");
      loadEntries();
    }});
  };
  const handleBatchMove = async () => {
    try { await invoke("batch_move_category", { ids: [...selected], categoryId: batchCategory }); showToast(`已移动 ${selected.size} 条`); exitSelect(); loadEntries(); }
    catch (e) { showToast(String(e)); }
  };

  return (
    <div className="flex-1 bg-black border-r border-gray-800 flex flex-col min-w-0">
      <div className="px-3 py-2 border-b border-gray-800 flex items-center justify-between">
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
          {favoritesOnly ? "收藏" : activeCategory ? "筛选结果" : "全部条目"}
          {displayed.length > 0 && <span className="ml-1.5 text-gray-600">{displayed.length}</span>}
        </span>
        <div className="flex items-center gap-2">
          <button onClick={() => setSelectMode(!selectMode)} className={`text-xs ${selectMode ? "text-blue-400" : "text-gray-600 hover:text-gray-400"}`}>
            {selectMode ? "取消选择" : "选择"}
          </button>
          {selectMode && (
            <button onClick={selectAll} className="text-xs text-gray-600 hover:text-gray-400">
              {selected.size === displayed.length ? "取消全选" : "全选"}
            </button>
          )}
        </div>
      </div>

      {selectMode && selected.size > 0 && (
        <div className="px-3 py-2 border-b border-gray-800 bg-neutral-900 flex items-center gap-2">
          <span className="text-xs text-gray-400">{selected.size} 条已选</span>
          <button onClick={() => setShowBatchDelete(true)} className="px-2 py-0.5 text-xs text-red-400 hover:bg-red-400/10">删除</button>
          <select value={batchCategory ?? ""} onChange={(e) => { const v = e.target.value ? Number(e.target.value) : null; setBatchCategory(v); if (v !== null) handleBatchMove(); }} className="text-xs bg-neutral-800 border border-gray-700 text-gray-300 px-1 py-0.5 focus:outline-none">
            <option value="">移动至分类...</option>
            <option value="">无分类</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-24"><div className="w-4 h-4 border-2 border-white border-t-transparent animate-spin" /></div>
        ) : displayed.length === 0 ? (
          <div className="text-center py-10 text-gray-500 text-sm"><p>暂无条目</p></div>
        ) : (
          displayed.map((entry) => (
            <div key={entry.id} className="relative flex items-center">
              {selectMode && (
                <input type="checkbox" checked={selected.has(entry.id)} onChange={() => toggleSelect(entry.id)} className="ml-3 accent-white" />
              )}
              <div className="flex-1"><EntryCard entry={entry} /></div>
            </div>
          ))
        )}
      </div>

      {showBatchDelete && (
        <ConfirmDialog title="批量删除" message={`确定删除 ${selected.size} 条记录？`} onConfirm={() => { setShowBatchDelete(false); handleBatchDelete(); }} onCancel={() => setShowBatchDelete(false)} />
      )}
    </div>
  );
}
