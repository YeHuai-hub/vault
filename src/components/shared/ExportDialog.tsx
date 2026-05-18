import { useState } from "react";
import { save } from "@tauri-apps/plugin-dialog";
import { invoke } from "../../lib/invoke";

interface Props { onClose: () => void; }

export default function ExportDialog({ onClose }: Props) {
  const [format, setFormat] = useState<"json" | "csv">("json");
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-neutral-950 border border-gray-700 w-full max-w-sm p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3"><h3 className="text-sm font-semibold text-white">导出密码库</h3><button onClick={onClose} className="text-gray-500 hover:text-white"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button></div>
        <div className="space-y-3">
          <div className="flex gap-2">{(["json", "csv"] as const).map((f) => (<button key={f} onClick={() => setFormat(f)} className={`flex-1 py-1.5 text-sm border ${format === f ? "bg-white/10 text-white border-white/30" : "bg-neutral-900 border-gray-700 text-gray-400 hover:border-gray-500"}`}>{f === "json" ? "JSON" : "CSV"}</button>))}</div>
          <p className="text-xs text-gray-500">{format === "json" ? "导出为明文 JSON。密码将以明文存储。" : "导出为 CSV 文件。密码将以明文存储。"}</p>
          <button onClick={async () => { setSaving(true); try { const e = format === "csv" ? "csv" : "json"; const p = await save({ defaultPath: `vault_export.${e}`, filters: [{ name: format === "csv" ? "CSV" : "JSON", extensions: [e] }] }); if (!p) { setSaving(false); return; } await invoke("export_vault", { path: p, format }); setResult("导出成功"); } catch (err) { setResult(`错误: ${err}`); } finally { setSaving(false); } }} disabled={saving} className="w-full py-2 bg-white hover:bg-gray-200 text-black text-sm font-semibold disabled:opacity-50">{saving ? "导出中..." : "选择位置并导出"}</button>
          {result && <p className={`text-xs ${result.startsWith("错误") ? "text-red-400" : "text-green-400"}`}>{result}</p>}
        </div>
      </div>
    </div>
  );
}
