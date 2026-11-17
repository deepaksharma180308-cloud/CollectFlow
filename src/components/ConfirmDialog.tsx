import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const ConfirmDialog: React.FC = () => {
  const { confirmState, closeConfirm } = useApp();
  if (!confirmState) return null;

  const isDanger = confirmState.tone === 'danger';

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50"
      role="alertdialog"
      aria-modal="true"
      onClick={closeConfirm}
    >
      <div
        className="w-full max-w-md bg-white rounded-xl border border-slate-200 shadow-xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3.5">
          <div
            className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
              isDanger ? 'bg-red-50 text-red-600' : 'bg-[#675BD3]/10 text-[#675BD3]'
            }`}
          >
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h3 className="text-base font-bold text-slate-900">{confirmState.title}</h3>
            <p className="mt-1.5 text-sm text-slate-600 leading-relaxed">{confirmState.message}</p>
          </div>
        </div>
        <div className="mt-6 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={closeConfirm}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              confirmState.onConfirm();
              closeConfirm();
            }}
            className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${
              isDanger
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-[#675BD3] hover:bg-[#574BC2]'
            }`}
          >
            {confirmState.confirmLabel || 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
};
