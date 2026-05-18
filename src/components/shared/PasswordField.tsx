import { useState, useRef, useCallback } from "react";
import { writeText } from "@tauri-apps/plugin-clipboard-manager";

interface Props { value: string; onChange: (value: string) => void; showStrength?: boolean; }
const AUTO_CLEAR_SECS = 30;

function passwordStrength(pwd: string): { score: number; label: string; color: string } {
  if (!pwd) return { score: 0, label: "", color: "" };
  let s = 0;
  if (pwd.length >= 8) s++;
  if (pwd.length >= 12) s++;
  if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) s++;
  if (/\d/.test(pwd)) s++;
  if (/[^a-zA-Z0-9]/.test(pwd)) s++;
  const labels = ["", "弱", "弱", "中", "强", "强"];
  const colors = ["", "bg-red-500", "bg-red-500", "bg-yellow-500", "bg-green-500", "bg-green-500"];
  return { score: Math.min(s, 5), label: labels[Math.min(s, 5)], color: colors[Math.min(s, 5)] };
}

export default function PasswordField({ value, onChange, showStrength }: Props) {
  const strength = showStrength ? passwordStrength(value) : null;
  const [show, setShow] = useState(false);
  const [copied, setCopied] = useState(false);
  const clearTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleCopy = useCallback(async () => {
    try {
      await writeText(value); setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      if (clearTimer.current) clearTimeout(clearTimer.current);
      clearTimer.current = setTimeout(async () => { try { await writeText(""); } catch {} }, AUTO_CLEAR_SECS * 1000);
    } catch { try { await navigator.clipboard.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch {} }
  }, [value]);

  return (
    <div className="flex gap-1">
      <div className="flex-1 relative">
        <input type={show ? "text" : "password"} value={value} onChange={(e) => onChange(e.target.value)}
          className="w-full px-2 py-0.5 bg-neutral-900 border border-gray-700 text-white text-sm pr-14 focus:outline-none focus:border-gray-400" placeholder="密码" />
        <button onClick={() => setShow(!show)} className="absolute right-8 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-gray-300" title={show ? "隐藏" : "显示"}>
          {show ?
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M15 12a3 3 0 01-3 3m-6 0l-3 3m0 0l3 3m-3-3h6m9-9l3-3m0 0l-3-3m3 3h-6" /></svg> :
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>}
        </button>
        <button onClick={handleCopy} className={`absolute right-1 top-1/2 -translate-y-1/2 p-0.5 ${copied ? "text-green-400" : "text-gray-500 hover:text-gray-300"}`} title={copied ? "已复制" : "复制"}>
          {copied ?
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg> :
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>}
        </button>
      </div>
      {strength && strength.score > 0 && (
        <div className="flex items-center gap-1 mt-1">
          <div className="flex-1 h-1 bg-neutral-800 flex">
            <div className={`h-full ${strength.color} transition-all`} style={{ width: `${(strength.score / 5) * 100}%` }} />
          </div>
          <span className="text-xs text-gray-600">{strength.label}</span>
        </div>
      )}
    </div>
  );
}
