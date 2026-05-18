import { useState, useEffect } from "react";
import { invoke } from "../../lib/invoke";

interface Props { onGenerate: (password: string) => void; onClose: () => void; }

export default function PasswordGenerator({ onGenerate, onClose }: Props) {
  const [length, setLength] = useState(20);
  const [uppercase, setUppercase] = useState(true);
  const [digits, setDigits] = useState(true);
  const [symbols, setSymbols] = useState(true);
  const [password, setPassword] = useState("");
  const [copied, setCopied] = useState(false);

  const generate = async () => { try { setPassword(await invoke("generate_password", { length, uppercase, digits, symbols })); setCopied(false); } catch (e) { setPassword(String(e)); } };
  useEffect(() => { generate(); }, []);

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-neutral-950 border border-gray-700 w-full max-w-sm p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-white">密码生成器</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-white"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
        </div>
        <div className="bg-neutral-900 border border-gray-700 p-2 mb-3 flex items-center justify-between">
          <span className="text-sm font-mono text-gray-200 break-all">{password}</span>
          <button onClick={async () => { await navigator.clipboard.writeText(password); setCopied(true); setTimeout(() => setCopied(false), 2000); }} className="ml-2 p-1 text-gray-400 hover:text-white flex-shrink-0" title="复制">
            {copied ? <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg> : <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>}
          </button>
        </div>
        <div className="space-y-2.5">
          <div><div className="flex justify-between text-xs text-gray-500 mb-1"><span>长度</span><span>{length}</span></div><input type="range" min={4} max={64} value={length} onChange={(e) => { setLength(Number(e.target.value)); generate(); }} className="w-full accent-white" /></div>
          <div className="flex gap-3">
            {[["A-Z", uppercase, setUppercase], ["0-9", digits, setDigits], ["符号", symbols, setSymbols]].map(([label, checked, setter]) => (
              <label key={label as string} className="flex items-center gap-1 text-xs text-gray-400 cursor-pointer">
                <input type="checkbox" checked={checked as boolean} onChange={(e) => { (setter as (v: boolean) => void)(e.target.checked); setTimeout(generate, 0); }} className="accent-white" />{label as string}
              </label>
            ))}
          </div>
          <button onClick={generate} className="w-full py-1.5 bg-neutral-800 hover:bg-neutral-700 text-gray-200 text-sm">重新生成</button>
          <button onClick={() => onGenerate(password)} className="w-full py-2 bg-white hover:bg-gray-200 text-black text-sm font-semibold">使用此密码</button>
        </div>
      </div>
    </div>
  );
}
