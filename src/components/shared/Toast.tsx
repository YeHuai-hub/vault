import { useUI } from "../../contexts/UIContext";

export default function Toast() {
  const { toast, toastAction } = useUI();
  if (!toast) return null;
  return (
    <div className="fixed bottom-4 right-4 bg-neutral-900 border border-gray-700 text-gray-200 text-sm px-3 py-1.5 shadow-xl z-50 animate-fade-in flex items-center gap-3">
      <span>{toast}</span>
      {toastAction && (
        <button onClick={toastAction.onClick} className="text-xs text-blue-400 hover:text-blue-300 font-medium">{toastAction.label}</button>
      )}
    </div>
  );
}
