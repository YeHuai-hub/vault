import { useState } from "react";
import { useVault } from "../../contexts/VaultContext";

export default function UnlockScreen() {
  const { unlockVault } = useVault();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(""); setLoading(true);
    try { await unlockVault(password); } catch (err) { setError(String(err)); }
    finally { setLoading(false); }
  };

  return (
    <div className="h-full flex items-center justify-center bg-black">
      <div className="w-full max-w-sm p-6">
        <div className="text-center mb-6">
          <h1 className="text-xl font-bold text-white mb-1.5">解锁密码库</h1>
          <p className="text-gray-500 text-sm">输入主密码以解锁。</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input type="password" placeholder="主密码" value={password} onChange={(e) => setPassword(e.target.value)}
            className="w-full px-2 py-1 bg-neutral-900 border border-gray-700 text-white text-sm focus:outline-none focus:border-gray-400 placeholder:text-gray-600" autoFocus />
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button type="submit" disabled={loading} className="w-full py-2 bg-white hover:bg-gray-200 text-black font-semibold text-sm disabled:opacity-50">{loading ? "解锁中..." : "解锁"}</button>
        </form>
      </div>
    </div>
  );
}
