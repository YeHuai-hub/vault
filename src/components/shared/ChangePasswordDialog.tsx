import { useState } from "react";
import { invoke } from "../../lib/invoke";

interface Props { onClose: () => void; }
const inpCls = "w-full px-2 py-1 bg-neutral-900 border border-gray-700 text-white text-sm focus:outline-none focus:border-gray-400 placeholder:text-gray-600";

export default function ChangePasswordDialog({ onClose }: Props) {
  const [current, setCurrent] = useState("");
  const [np, setNp] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleChange = async () => {
    setError("");
    if (np.length < 8) { setError("新密码至少需要 8 个字符"); return; }
    if (np !== confirm) { setError("两次输入的密码不一致"); return; }
    setLoading(true);
    try { await invoke("change_master_password", { oldPassword: current, newPassword: np }); setDone(true); }
    catch (e) { setError(String(e)); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-neutral-950 border border-gray-700 w-full max-w-sm p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3"><h3 className="text-sm font-semibold text-white">修改主密码</h3><button onClick={onClose} className="text-gray-500 hover:text-white"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button></div>
        {done ? (
          <div className="text-center py-3"><p className="text-sm text-green-400 mb-2">密码修改成功</p><button onClick={onClose} className="text-sm text-gray-400 hover:text-white">关闭</button></div>
        ) : (
          <div className="space-y-2.5">
            <input type="password" placeholder="当前密码" value={current} onChange={(e) => setCurrent(e.target.value)} className={inpCls} autoFocus />
            <input type="password" placeholder="新密码（至少 8 位）" value={np} onChange={(e) => setNp(e.target.value)} className={inpCls} />
            <input type="password" placeholder="确认新密码" value={confirm} onChange={(e) => setConfirm(e.target.value)} className={inpCls} />
            {error && <p className="text-xs text-red-400">{error}</p>}
            <button onClick={handleChange} disabled={loading} className="w-full py-2 bg-white hover:bg-gray-200 text-black text-sm font-semibold disabled:opacity-50">{loading ? "修改中..." : "修改密码"}</button>
          </div>
        )}
      </div>
    </div>
  );
}
