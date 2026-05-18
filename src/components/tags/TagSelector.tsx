import { useState, useEffect, useCallback } from "react";
import { invoke } from "../../lib/invoke";

interface Props { selectedIds: number[]; onChange: (ids: number[]) => void; }

export default function TagSelector({ selectedIds, onChange }: Props) {
  const [tags, setTags] = useState<{ id: number; name: string }[]>([]);
  const [newTag, setNewTag] = useState("");

  const loadTags = useCallback(async () => { try { setTags(await invoke("list_tags")); } catch {} }, []);
  useEffect(() => { loadTags(); }, [loadTags]);

  const handleAddTag = async () => {
    if (!newTag.trim()) return;
    try { const tag = await invoke<{ id: number; name: string }>("create_tag", { name: newTag.trim() }); setTags(prev => [...prev, tag]); onChange([...selectedIds, tag.id]); setNewTag(""); } catch {}
  };

  const handleRemove = (id: number) => {
    onChange(selectedIds.filter(tid => tid !== id));
  };

  const handleAdd = (id: number) => {
    onChange([...selectedIds, id]);
  };

  return (
    <div>
      <span className="text-xs text-gray-500">标签</span>
      <div className="flex flex-wrap gap-1 mt-1 mb-1.5">
        {tags.map((tag) => {
          const isSelected = selectedIds.includes(tag.id);
          return isSelected ? (
            <button
              key={tag.id}
              type="button"
              onClick={() => handleRemove(tag.id)}
              className="px-2 py-0.5 text-xs bg-white/10 text-white border border-white/30 hover:bg-white/20"
            >
              {tag.name} ×
            </button>
          ) : (
            <button
              key={tag.id}
              type="button"
              onClick={() => handleAdd(tag.id)}
              className="px-2 py-0.5 text-xs bg-neutral-900 text-gray-400 border border-gray-700 hover:border-gray-500"
            >
              {tag.name}
            </button>
          );
        })}
      </div>
      <div className="flex gap-1">
        <input type="text" value={newTag} onChange={(e) => setNewTag(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleAddTag()} className="flex-1 px-2 py-1 bg-neutral-900 border border-gray-700 text-white text-xs focus:outline-none focus:border-gray-400" placeholder="新标签..." />
        <button type="button" onClick={handleAddTag} className="px-2 py-1 bg-white text-black text-xs font-semibold hover:bg-gray-200">添加</button>
      </div>
    </div>
  );
}
