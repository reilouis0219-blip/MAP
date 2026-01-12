
import React from 'react';

interface InsightsModalProps {
  isOpen: boolean;
  isMinimized: boolean;
  loading: boolean;
  content: string;
  onClose: () => void;
  onMinimize: () => void;
}

const InsightsModal: React.FC<InsightsModalProps> = ({
  isOpen,
  isMinimized,
  loading,
  content,
  onClose,
  onMinimize
}) => {
  if (!isOpen) return null;

  const handleDownload = () => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `台南空間策略分析_${new Date().toLocaleDateString()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className={`fixed z-[1100] right-[370px] transition-all duration-300 ease-in-out ${
      isMinimized ? 'bottom-8 h-12 w-64' : 'bottom-8 h-[500px] w-[400px]'
    }`}>
      <div className="h-full w-full bg-white/80 backdrop-blur-xl border border-slate-200 shadow-2xl rounded-3xl flex flex-col overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between px-6 py-3 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
            <span className="text-[11px] font-black text-slate-800 tracking-wider uppercase">AI 空間策略報告</span>
          </div>
          <div className="flex items-center gap-2">
            {!isMinimized && (
              <button onClick={handleDownload} className="p-1.5 text-slate-400 hover:text-blue-600 transition-colors" title="下載報告">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
              </button>
            )}
            <button onClick={onMinimize} className="p-1.5 text-slate-400 hover:text-slate-600 transition-colors">
              {isMinimized ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16"/></svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 12H6"/></svg>
              )}
            </button>
            <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>
        </header>

        {/* Content */}
        {!isMinimized && (
          <div className="flex-1 p-6 overflow-y-auto custom-scrollbar bg-white/30 text-slate-700">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-full gap-4">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-xs font-bold text-slate-400">正在生成深度空間分析建議...</p>
              </div>
            ) : (
              <div className="prose prose-slate prose-sm max-w-none">
                <div className="whitespace-pre-wrap leading-relaxed text-[13px]">{content}</div>
              </div>
            )}
          </div>
        )}
      </div>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default InsightsModal;
