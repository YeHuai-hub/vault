import { useState, useEffect, useRef } from "react";
import { useEntries } from "../../contexts/EntryContext";
import { useUI } from "../../contexts/UIContext";
import { invoke } from "../../lib/invoke";
import type { Entry } from "../../types";

export default function EntryCard({ entry }: { entry: Entry }) {
  const { selectedEntry, getEntry, selectEntry, toggleFavorite, loadEntries } = useEntries();
  const { setDetailOpen } = useUI();
  const isSelected = selectedEntry?.id === entry.id;
  const [imgError, setImgError] = useState(false);
  const [totpCode, setTotpCode] = useState("");
  const [totpRemaining, setTotpRemaining] = useState(0);
  const totpTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasTotp = !!entry.totp_secret;

  useEffect(() => {
    if (!hasTotp) return;
    const updateTOTP = async () => {
      try {
        const code = await invoke<string>("generate_totp", { id: entry.id });
        setTotpCode(code);
        const now = Math.floor(Date.now() / 1000);
        setTotpRemaining(30 - (now % 30));
      } catch { setTotpCode(""); }
    };
    updateTOTP();
    totpTimer.current = setInterval(updateTOTP, 1000);
    return () => { if (totpTimer.current) clearInterval(totpTimer.current); };
  }, [entry.id, hasTotp]);

  const domain = entry.website
    ? new URL(entry.website.startsWith("http") ? entry.website : `https://${entry.website}`).hostname.replace("www.", "")
    : null;
  const faviconUrl = domain && !imgError ? `https://icons.duckduckgo.com/ip3/${domain}.ico` : null;

  const handleClick = async () => {
    try { const full = await getEntry(entry.id); selectEntry(full); } catch { selectEntry(entry); }
    setDetailOpen(true);
  };
  const handleToggleFav = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try { await toggleFavorite(entry.id); loadEntries(); } catch {}
  };

  return (
    <div className="group relative">
      <button onClick={handleClick} className={`w-full text-left px-3 py-2 border-b border-gray-800/50 hover:bg-neutral-900 ${isSelected ? "bg-neutral-900 border-l-2 border-l-white" : ""}`}>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 flex items-center justify-center text-xs font-bold flex-shrink-0 bg-neutral-800 text-gray-300 relative">
            <span className={faviconUrl && !imgError ? "invisible" : ""}>{entry.title[0].toUpperCase()}</span>
            {faviconUrl && !imgError && <img src={faviconUrl} className="w-4 h-4 absolute" onError={() => setImgError(true)} alt="" />}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1">
              <span className="text-sm text-gray-200 truncate">{entry.title}</span>
              {entry.is_favorite && <span className="text-yellow-500 flex-shrink-0 text-xs">★</span>}
            </div>
            <div className="flex items-center gap-1 mt-0.5">
              {entry.category_name && <span className="text-xs text-gray-500 truncate">{entry.category_name}</span>}
              {entry.category_name && (entry.username || domain) && <span className="text-gray-700 text-xs">·</span>}
              {entry.username && <span className="text-xs text-gray-500 truncate">{entry.username}</span>}
              {entry.username && domain && <span className="text-gray-700 text-xs">·</span>}
              {domain && <span className="text-xs text-gray-600 truncate">{domain}</span>}
            </div>
          </div>
        </div>
      </button>
      <button onClick={handleToggleFav} className={`absolute right-2 top-1/2 -translate-y-1/2 p-1 text-sm ${entry.is_favorite ? "text-yellow-500" : "text-gray-600 opacity-0 group-hover:opacity-100 hover:text-yellow-500"}`} title={entry.is_favorite ? "取消收藏" : "收藏"}>
        {entry.is_favorite ? "★" : "☆"}
      </button>
      {hasTotp && totpCode && (
        <div className="absolute right-8 top-1/2 -translate-y-1/2 flex items-center gap-2 text-xs">
          <span className="font-mono text-green-400 font-bold tracking-wider">{totpCode.slice(0, 3)} {totpCode.slice(3)}</span>
          <div className="w-1 h-4 bg-neutral-700 relative">
            <div className="absolute bottom-0 left-0 right-0 bg-green-500 transition-all" style={{ height: `${(totpRemaining / 30) * 100}%` }} />
          </div>
        </div>
      )}
    </div>
  );
}
