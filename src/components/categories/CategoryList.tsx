import { useState, useEffect, useCallback } from "react";
import { useUI } from "../../contexts/UIContext";
import { invoke } from "../../lib/invoke";
import type { Category } from "../../types";

export default function CategoryList() {
  const { activeCategory, setActiveCategory, activeTag, setActiveTag, showToast, tagRefreshKey, refreshTags, refreshData } = useUI();
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<{ id: number; name: string; entry_count: number }[]>([]);
  const [newCategory, setNewCategory] = useState("");
  const [newTag, setNewTag] = useState("");
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [showAddTag, setShowAddTag] = useState(false);
  const [tagsOpen, setTagsOpen] = useState(true);

  const loadCategories = useCallback(async () => { try { setCategories(await invoke("list_categories")); } catch {} }, []);
  const loadTags = useCallback(async () => { try { setTags(await invoke("list_tags")); } catch {} }, []);
  useEffect(() => { loadCategories(); loadTags(); }, [loadCategories, loadTags, tagRefreshKey]);

  const handleAddCategory = async () => { if (!newCategory.trim()) return; try { await invoke("create_category", { name: newCategory.trim(), icon: null }); setNewCategory(""); setShowAddCategory(false); loadCategories(); refreshData(); } catch {} };
  const handleAddTag = async () => { if (!newTag.trim()) return; try { await invoke("create_tag", { name: newTag.trim() }); setNewTag(""); setShowAddTag(false); loadTags(); refreshTags(); } catch {} };
  const handleDeleteCategory = async (id: number) => { try { await invoke("delete_category", { id }); loadCategories(); refreshData(); showToast("分类已删除"); } catch (e) { showToast(String(e)); } };
  const handleDeleteTag = async (id: number) => { try { await invoke("delete_tag", { id }); loadTags(); refreshTags(); showToast("标签已删除"); } catch (e) { showToast(String(e)); } };

  const inpCls = "flex-1 px-2 py-0 bg-neutral-900 border border-gray-700 text-white text-xs focus:outline-none focus:border-gray-400 placeholder:text-gray-600";

  return (
    <div className="space-y-2 text-sm">
      <div>
        <div className="flex items-center justify-between mb-0.5">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">分类</span>
          <button onClick={() => setShowAddCategory(!showAddCategory)} className="text-gray-600 hover:text-gray-300 text-xs">+</button>
        </div>
        {showAddCategory && (
          <div className="flex gap-1 mb-1">
            <input type="text" value={newCategory} onChange={(e) => setNewCategory(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleAddCategory()} className={inpCls} placeholder="分类名" autoFocus />
            <button onClick={handleAddCategory} className="px-2 py-0.5 bg-white text-black text-xs font-semibold hover:bg-gray-200">添加</button>
          </div>
        )}
        <div className="space-y-0.5">
          <button onClick={() => setActiveCategory(null)} className={`w-full text-left px-2 py-1 text-sm ${activeCategory === null ? "bg-white/10 text-white" : "text-gray-400 hover:text-gray-200 hover:bg-neutral-900"}`}>全部</button>
          {categories.map((cat) => (
            <div key={cat.id} className="group flex items-center">
              <button onClick={() => setActiveCategory(activeCategory === cat.id ? null : cat.id)} className={`flex-1 text-left px-2 py-1 text-sm flex items-center justify-between ${activeCategory === cat.id ? "bg-white/10 text-white" : "text-gray-400 hover:text-gray-200 hover:bg-neutral-900"}`}>
                <span>{cat.icon ? `${cat.icon} ${cat.name}` : cat.name}</span>
                {cat.entry_count > 0 && <span className="text-xs text-gray-600">{cat.entry_count}</span>}
              </button>
              <button onClick={() => handleDeleteCategory(cat.id)} className="px-1 text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 text-xs">×</button>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-0.5">
          <button onClick={() => setTagsOpen(!tagsOpen)} className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1 hover:text-gray-300">
            <span className={`text-xs transition-transform ${tagsOpen ? "" : "-rotate-90"}`}>&#9660;</span> 标签
          </button>
          <button onClick={() => setShowAddTag(!showAddTag)} className="text-gray-600 hover:text-gray-300 text-xs">+</button>
        </div>
        {showAddTag && (
          <div className="flex gap-1 mb-1">
            <input type="text" value={newTag} onChange={(e) => setNewTag(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleAddTag()} className={inpCls} placeholder="标签名" autoFocus />
            <button onClick={handleAddTag} className="px-2 py-0.5 bg-white text-black text-xs font-semibold hover:bg-gray-200">添加</button>
          </div>
        )}
        {tagsOpen && (
          <div className="flex flex-wrap gap-1">
            {tags.map((tag) => (
              <div key={tag.id} className="group flex items-center">
                <button onClick={() => setActiveTag(activeTag === tag.id ? null : tag.id)} className={`px-2 py-0.5 text-xs border ${activeTag === tag.id ? "bg-white/10 text-white border-white/30" : "bg-neutral-900 text-gray-400 border-gray-700 hover:border-gray-500"}`}>
                  {tag.name}{tag.entry_count > 0 && <span className="ml-1 text-gray-600">{tag.entry_count}</span>}
                </button>
                <button onClick={() => handleDeleteTag(tag.id)} className="ml-0.5 text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 text-xs">×</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
