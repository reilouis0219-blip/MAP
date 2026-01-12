
import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import MapComponent from './components/MapComponent';
import InsightsModal from './components/InsightsModal';
import { LayerType, ResourceItem, DemandItem } from './types';
import { getInsights } from './services/geminiService';

const App: React.FC = () => {
  const [resources, setResources] = useState<ResourceItem[]>([]);
  const [demands, setDemands] = useState<DemandItem[]>([]);
  const [activeLayers, setActiveLayers] = useState<Set<LayerType>>(new Set([LayerType.RESOURCE, LayerType.DEMAND]));
  const [densityScale, setDensityScale] = useState<number>(1.0);
  const [insights, setInsights] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  
  // 視窗狀態
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isMinimized, setIsMinimized] = useState<boolean>(false);

  const toggleLayer = (type: LayerType) => {
    setActiveLayers(prev => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  };

  const handleReset = (type: LayerType) => {
    if (type === LayerType.RESOURCE) setResources([]);
    else setDemands([]);
    setInsights('');
    setIsModalOpen(false);
  };

  const handleDataLoaded = (type: LayerType, data: any[]) => {
    if (type === LayerType.RESOURCE) {
      setResources(prev => [...prev, ...data]);
    } else {
      setDemands(prev => [...prev, ...data]);
    }
  };

  const generateInsights = useCallback(async () => {
    if (resources.length === 0 || demands.length === 0) return;
    setLoading(true);
    setIsModalOpen(true);
    setIsMinimized(false);
    try {
      const text = await getInsights(resources, demands);
      setInsights(text || '');
    } catch (error) {
      console.error("Gemini Error:", error);
      setInsights("AI 空間平衡分析暫時無法載入。");
    } finally {
      setLoading(false);
    }
  }, [resources, demands]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (resources.length > 0 && demands.length > 0) {
        generateInsights();
      }
    }, 1500);
    return () => clearTimeout(timer);
  }, [resources, demands, generateInsights]);

  // 計算平均每百人需求
  const averageDemandPerHundred = demands.length > 0 
    ? (demands.reduce((acc, curr) => acc + curr.count, 0) / demands.length).toFixed(1)
    : "0";

  return (
    <div className="flex h-screen w-full bg-slate-50 overflow-hidden font-sans antialiased">
      {/* 主要內容區域：左側地圖 */}
      <main className="flex-1 flex flex-col relative order-1">
        {/* 懸浮看板 */}
        <header className="absolute top-6 left-1/2 -translate-x-1/2 z-[1000] flex gap-4 pointer-events-none">
          <div className="bg-white/80 backdrop-blur-md border border-slate-200 shadow-xl px-10 py-5 rounded-[2.5rem] flex items-center gap-12 pointer-events-auto">
            <div className="flex flex-col">
              <span className="text-[10px] text-blue-600 font-bold uppercase tracking-[0.2em] mb-1">資源總量能</span>
              <span className="text-2xl font-black text-slate-800">{resources.reduce((acc, curr) => acc + curr.capacity, 0).toLocaleString()}</span>
            </div>
            <div className="w-px h-10 bg-slate-200"></div>
            <div className="flex flex-col">
              <span className="text-[10px] text-rose-600 font-bold uppercase tracking-[0.2em] mb-1">平均需求 (每百人)</span>
              <span className="text-2xl font-black text-slate-800">{averageDemandPerHundred}</span>
            </div>
          </div>
        </header>
        
        <MapComponent 
          resources={resources} 
          demands={demands} 
          activeLayers={activeLayers}
          densityScale={densityScale}
        />

        {/* AI 分析彈出視窗 */}
        <InsightsModal 
          isOpen={isModalOpen}
          isMinimized={isMinimized}
          loading={loading}
          content={insights}
          onClose={() => setIsModalOpen(false)}
          onMinimize={() => setIsMinimized(!isMinimized)}
        />

        {/* 淺色圖例 */}
        <div className="absolute bottom-8 left-8 z-[1000] flex flex-col gap-2">
          <div className="bg-white/90 backdrop-blur-md p-6 rounded-3xl shadow-lg border border-slate-100 min-w-[260px]">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">圖層顯示規則</h4>
            <div className="space-y-5">
              {/* 醫療資源圖例 */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-blue-800 border border-slate-300"></div>
                  <span className="text-xs text-slate-700 font-bold">醫療量能 (百人色階)</span>
                </div>
                <div className="flex gap-1 mt-1 pl-6">
                   <div className="w-3 h-2 bg-[#dbeafe] rounded-sm" title="<100"></div>
                   <div className="w-3 h-2 bg-[#93c5fd] rounded-sm" title="200-300"></div>
                   <div className="w-3 h-2 bg-[#3b82f6] rounded-sm" title="400-500"></div>
                   <div className="w-3 h-2 bg-[#1d4ed8] rounded-sm" title="600-700"></div>
                   <div className="w-3 h-2 bg-[#172554] rounded-sm" title=">900"></div>
                   <span className="text-[9px] text-slate-400 ml-1">深:高 淺:低</span>
                </div>
              </div>
              
              {/* 個案需求圖例 */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-rose-800 border border-slate-300"></div>
                  <span className="text-xs text-slate-700 font-bold">個案需求 (百人色階)</span>
                </div>
                <div className="flex gap-1 mt-1 pl-6">
                   <div className="w-3 h-2 bg-[#ffe4e6] rounded-sm" title="<100"></div>
                   <div className="w-3 h-2 bg-[#fda4af] rounded-sm" title="200-300"></div>
                   <div className="w-3 h-2 bg-[#f43f5e] rounded-sm" title="400-500"></div>
                   <div className="w-3 h-2 bg-[#be123c] rounded-sm" title="600-700"></div>
                   <div className="w-3 h-2 bg-[#4c0519] rounded-sm" title=">900"></div>
                   <span className="text-[9px] text-slate-400 ml-1">深:高 淺:低</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* 側邊欄：固定寬度 */}
      <Sidebar 
        onDataLoaded={handleDataLoaded} 
        activeLayers={activeLayers} 
        toggleLayer={toggleLayer}
        densityScale={densityScale}
        setDensityScale={setDensityScale}
        loading={loading}
        onReset={handleReset}
        onOpenInsights={() => { setIsModalOpen(true); setIsMinimized(false); }}
        hasInsights={!!insights}
        className="order-2 flex-shrink-0"
      />
    </div>
  );
};

export default App;
