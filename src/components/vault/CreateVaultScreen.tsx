import { useState } from "react";
import { useVault } from "../../contexts/VaultContext";

export default function CreateVaultScreen() {
  const { createVault } = useVault();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError("");
    if (password.length < 8) { setError("密码至少需要 8 个字符"); return; }
    if (password !== confirm) { setError("两次输入的密码不一致"); return; }
    setLoading(true);
    try { await createVault(password); } catch (err) { setError(String(err)); }
    finally { setLoading(false); }
  };

  const inpCls = "w-full px-2 py-1 bg-neutral-900 border border-gray-700 text-white text-sm focus:outline-none focus:border-gray-400 placeholder:text-gray-600";

  return (
    <div className="h-full flex items-center justify-center bg-black">
      <div className="w-full max-w-sm p-6">
        <div className="text-center mb-6">
          <h1 className="text-xl font-bold text-white mb-1.5">创建密码库</h1>
          <p className="text-gray-500 text-sm">设置主密码来加密你的数据。此密码无法恢复。</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input type="password" placeholder="主密码" value={password} onChange={(e) => setPassword(e.target.value)} className={inpCls} autoFocus />
          <input type="password" placeholder="确认密码" value={confirm} onChange={(e) => setConfirm(e.target.value)} className={inpCls} />
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button type="submit" disabled={loading} className="w-full py-2 bg-white hover:bg-gray-200 text-black font-semibold text-sm disabled:opacity-50">{loading ? "创建中..." : "创建密码库"}</button>
        </form>
      </div>
    </div>
  );
}
