interface CodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCopy: () => void;
  title: string;
  code: string;
}

export function CodeModal({ isOpen, onClose, onCopy, title, code }: CodeModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h3 className="text-xl font-semibold">{title}</h3>
          <div className="flex gap-3">
            <button
              onClick={onCopy}
              className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg transition-colors flex items-center gap-2 text-sm"
            >
              <span>📋</span>
              Copy to Clipboard
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-colors flex items-center gap-2 text-sm"
            >
              ✕
            </button>
          </div>
        </div>
        <div className="p-6 overflow-auto max-h-[calc(90vh-120px)]">
          <pre className="bg-gray-900 p-4 rounded-lg text-sm text-green-400 font-mono overflow-x-auto">
            <code>{code}</code>
          </pre>
        </div>
      </div>
    </div>
  );
}
