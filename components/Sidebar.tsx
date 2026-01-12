
import React, { useRef, useState } from 'react';
import { LayerType, ResourceItem, DemandItem } from '../types';
import { RESOURCE_TEMPLATE_CSV, DEMAND_TEMPLATE_CSV } from '../constants';
import { parseResourceCSVWithGemini, parseDemandCSVWithGemini } from '../services/geminiService';

interface SidebarProps {
  onDataLoaded: (type: LayerType, data: any[]) => void;
  activeLayers: Set<LayerType>;
  toggleLayer: (type: LayerType) => void;
  densityScale: number;
  setDensityScale: (val: number) => void;
  loading: boolean;
  onReset: (type: LayerType) => void;
  onOpenInsights: () => void;
  hasInsights: boolean;
  className?: string;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  onDataLoaded, 
  activeLayers, 
  toggleLayer, 
  densityScale,
  setDensityScale,
  loading, 
  onReset,
  onOpenInsights,
  hasInsights,
  className = ""
}) => {
  const resourceInputRef = useRef<HTMLInputElement>(null);
  const demandInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, type: LayerType) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    const reader = new FileReader();
    reader.onload = async (e) => {
      const content = e.target?.result as string;
      try {
        if (type === LayerType.RESOURCE) {
          const parsed = await parseResourceCSVWithGemini(content);
          const withIds = parsed.map((item: any, idx: number) => ({
            ...item,
            id: `res-${idx}-${Date.now()}`
          }));
          onDataLoaded(type, withIds);
        } else {
          const parsed = await parseDemandCSVWithGemini(content);
          const withIds = parsed.map((item: any, idx: number) => ({
            ...item,
            id: `dem-${idx}-${Date.now()}`
          }));
          onDataLoaded(type, withIds);
        }
      } catch (err) {
        console.error("處理檔案失敗:", err);
        alert("資料解析失敗，請確認 CSV 格式是否正確。");
      } finally {
        setIsProcessing(false);
        event.target.value = '';
      }
    };
    reader.readAsText(file);
  };

  const downloadTemplate = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className={`w-[350px] min-w-[350px] max-w-[350px] h-full bg-white text-slate-800 flex flex-col shadow-[-4px_0_24px_rgba(0,0,0,0.05)] border-l border-slate-100 overflow-y-auto ${className}`}>
      <div className="p-8">
        <header className="mb-10 border-b border-slate-50 pb-6">
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <span className="w-2 h-8 bg-blue-600 rounded-full"></span>
            台南數據中心
          </h1>
          <p className="text-[10px] text-slate-400 font-bold tracking-[0.2em] uppercase mt-2">Resource Map Control Panel</p>
        </header>

        {/* 狀態提示 */}
        {isProcessing && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-100 rounded-2xl animate-pulse">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
              <span className="text-[11px] font-bold text-amber-700">AI 正在進行地理空間精確編碼...</span>
            </div>
          </div>
        )}

        {/* 檔案上傳區 */}
        <section className="mb-10">
          <h2 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-5 flex items-center justify-between">
            數據上傳與範本
          </h2>
          <div className="space-y-4">
             <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-blue-200 transition-colors">
               <div className="flex items-center justify-between mb-3">
                 <span className="text-xs font-bold text-slate-600">醫療資源數據</span>
                 <button onClick={() => downloadTemplate(RESOURCE_TEMPLATE_CSV, '資源上傳範本.csv')} className="text-blue-500 hover:text-blue-700 transition-colors">
                   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                 </button>
               </div>
               <button 
                 disabled={isProcessing}
                 onClick={() => resourceInputRef.current?.click()} 
                 className={`w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-100 active:scale-[0.98] ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}>
                 上傳資源 CSV
               </button>
               <input type="file" hidden ref={resourceInputRef} accept=".csv" onChange={(e) => handleFileUpload(e, LayerType.RESOURCE)} />
             </div>

             <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-rose-200 transition-colors">
               <div className="flex items-center justify-between mb-3">
                 <span className="text-xs font-bold text-slate-600">個案需求數據</span>
                 <button onClick={() => downloadTemplate(DEMAND_TEMPLATE_CSV, '需求上傳範本.csv')} className="text-rose-500 hover:text-rose-700 transition-colors">
                   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                 </button>
               </div>
               <button 
                 disabled={isProcessing}
                 onClick={() => demandInputRef.current?.click()} 
                 className={`w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-rose-100 active:scale-[0.98] ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}>
                 上傳需求 CSV
               </button>
               <input type="file" hidden ref={demandInputRef} accept=".csv" onChange={(e) => handleFileUpload(e, LayerType.DEMAND)} />
             </div>
          </div>
        </section>

        {/* 顯示設定 */}
        <section className="mb-10">
          <h2 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-5">圖層控制與視覺調節</h2>
          <div className="space-y-3">
            <div className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${activeLayers.has(LayerType.RESOURCE) ? 'bg-blue-50 border-blue-100' : 'bg-white border-slate-100'}`}>
              <span className="text-xs font-bold text-slate-700">醫療資源 (頂層)</span>
              <div className="flex items-center gap-4">
                <button onClick={() => onReset(LayerType.RESOURCE)} className="text-slate-300 hover:text-red-500 transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
                <div onClick={() => toggleLayer(LayerType.RESOURCE)} className={`w-10 h-5 rounded-full relative cursor-pointer transition-colors ${activeLayers.has(LayerType.RESOURCE) ? 'bg-blue-600' : 'bg-slate-200'}`}>
                  <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${activeLayers.has(LayerType.RESOURCE) ? 'left-6' : 'left-1'}`}></div>
                </div>
              </div>
            </div>

            <div className={`flex flex-col p-4 rounded-2xl border transition-all ${activeLayers.has(LayerType.DEMAND) ? 'bg-rose-50 border-rose-100' : 'bg-white border-slate-100'}`}>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold text-slate-700">個案需求 (底層)</span>
                <div className="flex items-center gap-4">
                  <button onClick={() => onReset(LayerType.DEMAND)} className="text-slate-300 hover:text-red-500 transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                  <div onClick={() => toggleLayer(LayerType.DEMAND)} className={`w-10 h-5 rounded-full relative cursor-pointer transition-colors ${activeLayers.has(LayerType.DEMAND) ? 'bg-rose-600' : 'bg-slate-200'}`}>
                    <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${activeLayers.has(LayerType.DEMAND) ? 'left-6' : 'left-1'}`}></div>
                  </div>
                </div>
              </div>
              
              {activeLayers.has(LayerType.DEMAND) && (
                <div className="pt-2 border-t border-rose-100/50">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] font-bold text-rose-400 uppercase tracking-tighter">視覺密度調節</span>
                    <span className="text-[10px] font-mono font-bold text-rose-600">{Math.round(densityScale * 100)}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="0.5" 
                    max="3.0" 
                    step="0.1" 
                    value={densityScale} 
                    onChange={(e) => setDensityScale(parseFloat(e.target.value))}
                    className="w-full h-1 bg-rose-200 rounded-lg appearance-none cursor-pointer accent-rose-600"
                  />
                </div>
              )}
            </div>
          </div>
        </section>

        {/* AI 分析開啟按鈕 */}
        {hasInsights && (
          <button 
            onClick={onOpenInsights}
            className="w-full py-4 bg-slate-900 hover:bg-black text-white rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-3 shadow-xl active:scale-[0.98]"
          >
            <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></span>
            查看空間策略分析視窗
          </button>
        )}
      </div>
      
      <div className="mt-auto p-6 bg-slate-50/50 border-t border-slate-100 text-[10px] text-slate-400 text-center tracking-widest uppercase">
        Tainan Spatial Hub v2.0
      </div>
    </div>
  );
};

export default Sidebar;
