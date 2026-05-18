interface Props { title: string; message: string; onConfirm: () => void; onCancel: () => void; }

export default function ConfirmDialog({ title, message, onConfirm, onCancel }: Props) {
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={onCancel}>
      <div className="bg-neutral-950 border border-gray-700 w-full max-w-xs p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-sm font-semibold text-white mb-1.5">{title}</h3>
        <p className="text-sm text-gray-400 mb-3">{message}</p>
        <div className="flex gap-2 justify-end">
          <button onClick={onCancel} className="px-3 py-1.5 text-sm text-gray-300 hover:bg-neutral-800">取消</button>
          <button onClick={onConfirm} className="px-3 py-1.5 text-sm bg-red-500 hover:bg-red-600 text-white">删除</button>
        </div>
      </div>
    </div>
  );
}
