import { useState } from "react";
import { useUI } from "../../contexts/UIContext";
import ExportDialog from "./ExportDialog";
import ImportDialog from "./ImportDialog";
import ChangePasswordDialog from "./ChangePasswordDialog";
import { open } from "@tauri-apps/plugin-dialog";
import { invoke } from "../../lib/invoke";

interface Props { onClose: () => void; }
const LOCK_OPTIONS = [{ value: 1, label: "1 分钟" }, { value: 5, label: "5 分钟" }, { value: 15, label: "15 分钟" }, { value: 30, label: "30 分钟" }];

export default function SettingsDialog({ onClose }: Props) {
  const { theme, setTheme, autoLockMinutes, setAutoLockMinutes } = useUI();
  const [showExport, setShowExport] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [showChangePwd, setShowChangePwd] = useState(false);

  return (
    <>
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={onClose}>
        <div className="bg-neutral-950 border border-gray-700 w-full max-w-sm p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between mb-4"><h3 className="text-sm font-semibold text-white">设置</h3><button onClick={onClose} className="text-gray-500 hover:text-white"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button></div>
          <div className="space-y-3">
            <div><span className="text-xs text-gray-500">主题</span><div className="flex gap-2 mt-1">{(["dark", "light"] as const).map((t) => (<button key={t} onClick={() => setTheme(t)} className={`flex-1 py-1.5 text-sm border ${theme === t ? "bg-white/10 text-white border-white/30" : "bg-neutral-900 border-gray-700 text-gray-400 hover:border-gray-500"}`}>{t === "dark" ? "暗色" : "亮色"}</button>))}</div></div>
            <div><span className="text-xs text-gray-500">自动锁定</span><div className="flex gap-2 mt-1">{LOCK_OPTIONS.map((opt) => (<button key={opt.value} onClick={() => setAutoLockMinutes(opt.value)} className={`flex-1 py-1.5 text-sm border ${autoLockMinutes === opt.value ? "bg-white/10 text-white border-white/30" : "bg-neutral-900 border-gray-700 text-gray-400 hover:border-gray-500"}`}>{opt.label}</button>))}</div></div>
            <div>
              <span className="text-xs text-gray-500">操作</span>
              <div className="mt-1 border border-gray-700">
                <button onClick={() => setShowChangePwd(true)} className="w-full text-left px-3 py-1.5 text-sm text-gray-400 hover:text-gray-200 hover:bg-neutral-900 border-b border-gray-700">修改主密码</button>
                <button onClick={() => setShowImport(true)} className="w-full text-left px-3 py-1.5 text-sm text-gray-400 hover:text-gray-200 hover:bg-neutral-900 border-b border-gray-700">导入密码库</button>
                <button onClick={() => setShowExport(true)} className="w-full text-left px-3 py-1.5 text-sm text-gray-400 hover:text-gray-200 hover:bg-neutral-900">导出密码库</button>
                <button onClick={async () => { try { const dir = await open({ directory: true, multiple: false, title: "选择备份目录" }); if (dir) { const path = await invoke<string>("backup_vault", { directory: dir as string }); alert(`备份成功: ${path}`); } } catch (e) { alert(String(e)); } }} className="w-full text-left px-3 py-1.5 text-sm text-gray-400 hover:text-gray-200 hover:bg-neutral-900">备份到...</button>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="w-full mt-5 py-2 bg-white hover:bg-gray-200 text-black text-sm font-semibold">关闭</button>
        </div>
      </div>
      {showExport && <ExportDialog onClose={() => setShowExport(false)} />}
      {showImport && <ImportDialog onClose={() => setShowImport(false)} />}
      {showChangePwd && <ChangePasswordDialog onClose={() => setShowChangePwd(false)} />}
    </>
  );
}
