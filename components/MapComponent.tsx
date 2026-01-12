
import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { LayerType, ResourceItem, DemandItem } from '../types';
import { TAINAN_CENTER, DISTRICT_COORDS } from '../constants';

interface MapComponentProps {
  resources: ResourceItem[];
  demands: DemandItem[];
  activeLayers: Set<LayerType>;
  densityScale: number;
}

const MapComponent: React.FC<MapComponentProps> = ({ resources, demands, activeLayers, densityScale }) => {
  const mapRef = useRef<L.Map | null>(null);
  const resourceLayerRef = useRef<L.LayerGroup | null>(null);
  const demandLayerRef = useRef<L.LayerGroup | null>(null);
  const labelLayerRef = useRef<L.LayerGroup | null>(null);
  const boundaryLayerRef = useRef<L.GeoJSON | null>(null);

  // 醫療資源量能色階 (藍色系，每 100 單位一層)
  const getResourceColor = (capacity: number) => {
    const level = Math.floor(capacity / 100);
    if (level <= 0) return '#dbeafe'; // <100
    if (level === 1) return '#bfdbfe'; // 100-200
    if (level === 2) return '#93c5fd'; // 200-300
    if (level === 3) return '#60a5fa'; // 300-400
    if (level === 4) return '#3b82f6'; // 400-500
    if (level === 5) return '#2563eb'; // 500-600
    if (level === 6) return '#1d4ed8'; // 600-700
    if (level === 7) return '#1e40af'; // 700-800
    if (level === 8) return '#1e3a8a'; // 800-900
    return '#172554'; // >900
  };

  // 個案需求量能色階 (玫瑰色系，每 100 單位一層)
  const getDemandColor = (count: number) => {
    const level = Math.floor(count / 100);
    if (level <= 0) return '#ffe4e6'; // <100
    if (level === 1) return '#fecdd3'; // 100-200
    if (level === 2) return '#fda4af'; // 200-300
    if (level === 3) return '#fb7185'; // 300-400
    if (level === 4) return '#f43f5e'; // 400-500
    if (level === 5) return '#e11d48'; // 500-600
    if (level === 6) return '#be123c'; // 600-700
    if (level === 7) return '#9f1239'; // 700-800
    if (level === 8) return '#881337'; // 800-900
    return '#4c0519'; // >900
  };

  useEffect(() => {
    if (!mapRef.current) {
      mapRef.current = L.map('map-viewport', {
        zoomControl: false,
        attributionControl: false
      }).setView(TAINAN_CENTER, 11);

      mapRef.current.createPane('demandPane');
      mapRef.current.getPane('demandPane')!.style.zIndex = '450';
      
      mapRef.current.createPane('resourcePane');
      mapRef.current.getPane('resourcePane')!.style.zIndex = '550';

      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
      }).addTo(mapRef.current);

      L.control.zoom({ position: 'bottomright' }).addTo(mapRef.current);

      resourceLayerRef.current = L.layerGroup().addTo(mapRef.current);
      demandLayerRef.current = L.layerGroup().addTo(mapRef.current);
      labelLayerRef.current = L.layerGroup().addTo(mapRef.current);

      fetch('https://raw.githubusercontent.com/g0v/twgeojson/master/json/townships_mainland.json')
        .then(res => res.json())
        .then(data => {
          if (mapRef.current && data.features) {
            const tainanFeatures = data.features.filter((f: any) => 
              f.properties.COUNTYNAME === "臺南市" || f.properties.COUNTYNAME === "台南市"
            );
            const geoJsonData = { type: "FeatureCollection", features: tainanFeatures };
            boundaryLayerRef.current = L.geoJSON(geoJsonData as any, {
              style: {
                color: '#cbd5e1',
                weight: 1,
                opacity: 0.4,
                fillColor: '#f1f5f9',
                fillOpacity: 0.1
              },
              onEachFeature: (feature, layer) => {
                const name = feature.properties.TOWNNAME || feature.properties.name;
                if (name) {
                   layer.bindTooltip(name, { sticky: true, className: 'tooltip-custom' });
                }
              }
            }).addTo(mapRef.current);
            boundaryLayerRef.current.bringToBack();
          }
        });

      Object.entries(DISTRICT_COORDS).forEach(([name, coords]) => {
        L.marker(coords as [number, number], {
          icon: L.divIcon({
            className: 'district-label',
            html: `<span>${name}</span>`,
            iconSize: [60, 20],
            iconAnchor: [30, 10]
          }),
          interactive: false
        }).addTo(labelLayerRef.current!);
      });
    }
  }, []);

  // 渲染資源 (上層) - 固定大小，顏色深淺代表量能
  useEffect(() => {
    if (resourceLayerRef.current && mapRef.current) {
      resourceLayerRef.current.clearLayers();
      if (activeLayers.has(LayerType.RESOURCE)) {
        resources.forEach(res => {
          const color = getResourceColor(res.capacity);
          const circle = L.circleMarker([res.lat, res.lng], {
            radius: 12, 
            color: '#1e293b',
            weight: 1.5,
            fillColor: color,
            fillOpacity: 0.9,
            pane: 'resourcePane',
            className: 'resource-marker'
          });

          circle.bindPopup(`
            <div class="p-2">
              <div class="text-[10px] font-bold text-blue-600 mb-1 uppercase tracking-wider">醫療資源中心</div>
              <h4 class="font-black text-slate-900 mb-2">${res.name}</h4>
              <div class="text-xs space-y-1">
                <p><span class="text-slate-400">百人量能層級:</span> <span class="text-blue-700 font-bold">${Math.floor(res.capacity/100)}</span></p>
                <p><span class="text-slate-400">總服務量能:</span> <span class="text-blue-600 font-bold">${res.capacity}</span></p>
                <p class="text-slate-500 italic text-[11px]">${res.address}</p>
              </div>
            </div>
          `);
          circle.addTo(resourceLayerRef.current!);
        });
      }
    }
  }, [resources, activeLayers]);

  // 渲染需求 (下層) - 改為固定大小，顏色深淺代表需求量
  useEffect(() => {
    if (demandLayerRef.current && mapRef.current) {
      demandLayerRef.current.clearLayers();
      if (activeLayers.has(LayerType.DEMAND)) {
        demands.forEach(dem => {
          const color = getDemandColor(dem.count);
          const circle = L.circleMarker([dem.lat, dem.lng], {
            radius: 12 * densityScale, // 基礎大小固定，可由 densityScale 微調縮放
            color: '#450a0a',
            weight: 1.2,
            fillColor: color,
            fillOpacity: 0.85,
            pane: 'demandPane'
          });

          circle.bindPopup(`
            <div class="p-2">
              <div class="text-[10px] font-bold text-rose-600 mb-1 uppercase tracking-wider">個案需求分布 (每百人)</div>
              <h4 class="font-black text-slate-900 mb-1">${dem.district} ${dem.village}</h4>
              <div class="text-xs space-y-1">
                <p><span class="text-slate-400">需求層級:</span> <span class="text-rose-700 font-bold">${Math.floor(dem.count/100)} (百人色階)</span></p>
                <p><span class="text-slate-400">個案需求數:</span> <span class="text-rose-600 font-bold">${dem.count}</span> / 百人</p>
              </div>
            </div>
          `);
          circle.addTo(demandLayerRef.current!);
        });
      }
    }
  }, [demands, activeLayers, densityScale]);

  return (
    <div className="flex-1 w-full h-full relative">
      <div id="map-viewport" className="w-full h-full" />
      <style>{`
        .tooltip-custom {
          background: rgba(255,255,255,0.9);
          border: none;
          box-shadow: 0 4px 12px rgba(0,0,0,0.05);
          font-weight: bold;
          font-size: 10px;
          padding: 2px 6px;
          border-radius: 4px;
        }
        .resource-marker {
          filter: drop-shadow(0 2px 4px rgba(0,0,0,0.1));
          transition: all 0.3s ease;
        }
        .resource-marker:hover {
          stroke-width: 3;
          stroke: #2563eb;
        }
      `}</style>
    </div>
  );
};

export default MapComponent;
