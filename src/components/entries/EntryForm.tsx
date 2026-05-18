import { useState, useCallback, useEffect, useRef } from "react";
import { useEntries } from "../../contexts/EntryContext";
import { useUI } from "../../contexts/UIContext";
import PasswordField from "../shared/PasswordField";
import PasswordGenerator from "../shared/PasswordGenerator";
import ConfirmDialog from "../shared/ConfirmDialog";
import { invoke } from "../../lib/invoke";
import type { CustomField, CreateEntry, UpdateEntry } from "../../types";

interface TagItem { id: number; name: string; }

export default function EntryForm() {
  const { selectedEntry, selectEntry, createEntry, updateEntry, deleteEntry, loadEntries } = useEntries();
  const { setDetailOpen, showToast, refreshTags, dataRefreshKey } = useUI();

  const [title, setTitle] = useState("");
  const [website, setWebsite] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [totpSecret, setTotpSecret] = useState("");
  const [notes, setNotes] = useState("");
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [tagIds, setTagIds] = useState<number[]>([]);
  const [tagNames, setTagNames] = useState<string[]>([]);
  const [newTagName, setNewTagName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [showGenerator, setShowGenerator] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const deleteTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isNew = !selectedEntry?.id;

  // Reset all fields when selected entry changes
  useEffect(() => {
    setTitle(selectedEntry?.title ?? "");
    setWebsite(selectedEntry?.website ?? "");
    setUsername(selectedEntry?.username ?? "");
    setPassword(selectedEntry?.password ?? "");
    setTotpSecret(selectedEntry?.totp_secret ?? "");
    setNotes(selectedEntry?.notes ?? "");
    setCategoryId(selectedEntry?.category_id ?? null);
    setCustomFields(selectedEntry?.custom_fields ?? []);
    setTagIds(selectedEntry?.tag_ids ?? []);
    setTagNames(selectedEntry?.tags ?? []);
  }, [selectedEntry?.id]);

  // Load categories
  useEffect(() => {
    invoke<{ id: number; name: string }[]>("list_categories").then(setCategories).catch(() => {});
  }, [dataRefreshKey]);
  useEffect(() => {
    if (selectedEntry?.tag_ids && selectedEntry.tag_ids.length > 0 && !(selectedEntry.tags && selectedEntry.tags.length > 0)) {
      invoke<TagItem[]>("list_tags").then((all) => {
        const names = all.filter(t => selectedEntry.tag_ids!.includes(t.id)).map(t => t.name);
        setTagNames(names);
      }).catch(() => {});
    }
  }, [selectedEntry?.id]);

  const handleAddTag = async () => {
    const name = newTagName.trim();
    if (!name || tagNames.includes(name)) { setNewTagName(""); return; }
    try {
      const tag = await invoke<TagItem>("create_tag", { name });
      setTagIds(prev => [...prev, tag.id]);
      setTagNames(prev => [...prev, tag.name]);
      setNewTagName("");
      refreshTags();
    } catch {}
  };
  const handleRemoveTag = (i: number) => { setTagIds(prev => prev.filter((_, idx) => idx !== i)); setTagNames(prev => prev.filter((_, idx) => idx !== i)); };

  const handleSave = async () => {
    if (!title.trim()) { showToast("标题不能为空"); return; }
    setIsSaving(true);
    try {
      if (isNew) {
        const entry: CreateEntry = { category_id: categoryId, title: title.trim(), website: website.trim() || null, username: username.trim(), password, notes: notes.trim() || null, custom_fields: customFields.length > 0 ? customFields : null, tag_ids: tagIds, totp_secret: totpSecret || null };
        const saved = await createEntry(entry); selectEntry(saved); showToast("已创建");
      } else {
        const entry: UpdateEntry = { category_id: categoryId, title: title.trim(), website: website.trim() || null, username: username.trim(), password, notes: notes.trim() || null, custom_fields: customFields.length > 0 ? customFields : null, tag_ids: tagIds, totp_secret: totpSecret || null };
        const saved = await updateEntry(selectedEntry!.id, entry); selectEntry(saved); showToast("已更新");
      }
      loadEntries();
    } catch (e) { showToast(String(e)); }
    finally { setIsSaving(false); }
  };

  const handleDelete = async () => {
    if (!selectedEntry?.id) return;
    setShowDeleteConfirm(false);
    const deleteId = selectedEntry.id;
    selectEntry(null);
    setDetailOpen(false);
    // Schedule deletion with undo window
    deleteTimer.current = setTimeout(async () => {
      try { await deleteEntry(deleteId); loadEntries(); showToast("已删除"); } catch (e) { showToast(String(e)); }
    }, 5000);
    showToast("条目已删除", { label: "撤销", onClick: handleUndoDelete });
  };
  const handleUndoDelete = () => {
    if (deleteTimer.current) { clearTimeout(deleteTimer.current); deleteTimer.current = null; }
    showToast("已撤销");
    loadEntries();
  };
  const handleClose = () => { selectEntry(null); setDetailOpen(false); };
  const addCustomField = () => setCustomFields([...customFields, { name: "", value: "" }]);
  const updateCustomField = (i: number, f: CustomField) => { const u = [...customFields]; u[i] = f; setCustomFields(u); };
  const removeCustomField = (i: number) => setCustomFields(customFields.filter((_, idx) => idx !== i));
  const handlePasswordGenerated = useCallback((pwd: string) => { setPassword(pwd); setShowGenerator(false); }, []);

  const inpCls = "w-full px-2 py-0.5 bg-neutral-900 border border-gray-700 text-white text-sm focus:outline-none focus:border-gray-400 placeholder:text-gray-600";

  return (
    <>
      <div className="w-72 flex-shrink-0 bg-neutral-950 border-l border-gray-800 flex flex-col h-full overflow-hidden">
        <div className="px-3 py-2 border-b border-gray-800 flex items-center justify-between">
          <span className="text-sm font-semibold text-gray-300">{isNew ? "新建条目" : "编辑条目"}</span>
          <button type="button" onClick={handleClose} className="p-1 text-gray-500 hover:text-white"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
        </div>

        <div className="flex-1 p-3 space-y-2.5 overflow-y-auto overflow-x-hidden min-h-0">
          <div>
            <span className="text-xs text-gray-500 mb-0.5 block">分类</span>
            <select value={categoryId ?? ""} onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : null)} className={inpCls}>
              <option value="">无</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div><span className="text-xs text-gray-500 mb-0.5 block">标题</span><input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className={inpCls} /></div>
          <div><span className="text-xs text-gray-500 mb-0.5 block">网址</span><input type="text" value={website} onChange={(e) => setWebsite(e.target.value)} className={inpCls} /></div>
          <div><span className="text-xs text-gray-500 mb-0.5 block">用户名</span><input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className={inpCls} /></div>
          <div>
            <div className="flex items-center justify-between mb-0.5"><span className="text-xs text-gray-500">密码</span><button type="button" onClick={() => setShowGenerator(true)} className="text-xs text-gray-400 hover:text-white">生成</button></div>
            <PasswordField value={password} onChange={setPassword} showStrength />
          </div>
          <div><span className="text-xs text-gray-500 mb-0.5 block">TOTP 密钥</span><input type="text" value={totpSecret} onChange={(e) => setTotpSecret(e.target.value)} className={inpCls} placeholder="用于两步验证的密钥" /></div>
          <div><span className="text-xs text-gray-500 mb-0.5 block">备注</span><textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className={inpCls + " resize-none"} /></div>

          <div>
            <span className="text-xs text-gray-500">标签</span>
            {tagNames.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1 mb-1.5">
                {tagNames.map((name, i) => (
                  <button key={i} type="button" onClick={() => handleRemoveTag(i)} className="px-2 py-0.5 text-xs bg-white/10 text-white border border-white/30 hover:bg-red-400/20 hover:border-red-400/30">{name} ×</button>
                ))}
              </div>
            )}
            <div className="flex gap-1">
              <input type="text" value={newTagName} onChange={(e) => setNewTagName(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddTag(); } }} className={inpCls + " flex-1"} placeholder="输入标签名，回车添加..." />
            </div>
          </div>

          {customFields.map((f, i) => (
            <div key={i} className="flex gap-1 min-w-0 items-end">
              <div className="min-w-0 flex-1"><span className="text-xs text-gray-500 mb-0.5 block">字段名</span><input type="text" value={f.name} onChange={(e) => updateCustomField(i, { ...f, name: e.target.value })} className={inpCls} /></div>
              <div className="min-w-0 flex-1"><span className="text-xs text-gray-500 mb-0.5 block">值</span><input type="text" value={f.value} onChange={(e) => updateCustomField(i, { ...f, value: e.target.value })} className={inpCls} /></div>
              <button type="button" onClick={() => removeCustomField(i)} className="p-1 text-gray-500 hover:text-red-400 mb-0.5"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
            </div>
          ))}
          <button type="button" onClick={addCustomField} className="text-xs text-gray-500 hover:text-gray-300">+ 添加字段</button>
        </div>

        <div className="p-3 border-t border-gray-800 space-y-1.5">
          <button type="button" onClick={handleSave} disabled={isSaving} className="w-full py-1 bg-white hover:bg-gray-200 text-black font-semibold text-sm disabled:opacity-50 transition-colors">
            {isSaving ? "保存中..." : isNew ? "创建条目" : "保存"}
          </button>
          {!isNew && <button type="button" onClick={() => setShowDeleteConfirm(true)} className="w-full py-1 text-red-400 hover:bg-red-400/10 text-sm">删除条目</button>}
        </div>
      </div>

      {showGenerator && <PasswordGenerator onGenerate={handlePasswordGenerated} onClose={() => setShowGenerator(false)} />}
      {showDeleteConfirm && <ConfirmDialog title="删除条目" message="确定删除？此操作不可撤销。" onConfirm={handleDelete} onCancel={() => setShowDeleteConfirm(false)} />}
    </>
  );
}
