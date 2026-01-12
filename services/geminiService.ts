
import { GoogleGenAI, Type } from "@google/genai";
import { DISTRICT_COORDS } from "../constants";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * 解析資源 CSV 並利用 AI 獲取精確經緯度
 */
export const parseResourceCSVWithGemini = async (csvContent: string) => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `
      你是一個地理資訊專家。解析以下台南市醫療資源 CSV 內容，並為每個地點找尋其精確的經緯度座標。
      CSV 內容：
      ${csvContent}
      
      請輸出 JSON 陣列，每個對象包含：
      - name: 名稱
      - address: 地址
      - capacity: 服務量能 (數字)
      - lat: 緯度 (請根據地址給出精確座標)
      - lng: 經度 (請根據地址給出精確座標)
    `,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            address: { type: Type.STRING },
            capacity: { type: Type.NUMBER },
            lat: { type: Type.NUMBER },
            lng: { type: Type.NUMBER }
          },
          required: ["name", "address", "capacity", "lat", "lng"]
        }
      }
    }
  });

  try {
    return JSON.parse(response.text || '[]');
  } catch (e) {
    console.error("Failed to parse Resource CSV", e);
    return [];
  }
};

/**
 * 解析需求 CSV 並利用 AI 獲取精確的「里別」中心經緯度
 */
export const parseDemandCSVWithGemini = async (csvContent: string) => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `
      你是一個台南地理專家。解析以下需求數據 CSV，並根據「區」與「里」的名稱，提供該行政里中心點的精確經緯度。
      CSV 內容：
      ${csvContent}
      
      請輸出 JSON 陣列，每個對象包含：
      - district: 區
      - village: 里
      - count: 個案數 (數字)
      - lat: 緯度 (該里的中心點)
      - lng: 經度 (該里的中心點)
    `,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            district: { type: Type.STRING },
            village: { type: Type.STRING },
            count: { type: Type.NUMBER },
            lat: { type: Type.NUMBER },
            lng: { type: Type.NUMBER }
          },
          required: ["district", "village", "count", "lat", "lng"]
        }
      }
    }
  });

  try {
    return JSON.parse(response.text || '[]');
  } catch (e) {
    console.error("Failed to parse Demand CSV", e);
    return [];
  }
};

export const getGeocode = (address: string, district?: string): [number, number] => {
  for (const [dist, coords] of Object.entries(DISTRICT_COORDS)) {
    if (address.includes(dist) || (district && district.includes(dist))) {
      return [
        coords[0] + (Math.random() - 0.5) * 0.005,
        coords[1] + (Math.random() - 0.5) * 0.005
      ];
    }
  }
  return [22.9997, 120.2270];
};

/**
 * 空間策略分析升級為 Pro 模型
 */
export const getInsights = async (resources: any[], demands: any[]) => {
  const prompt = `
    你是一個資深的都市發展與公共醫療策略顧問。
    以下是目前台南市的精確地理數據：
    資源端（醫療機構）：${JSON.stringify(resources.slice(0, 15))}
    需求端（個案分布）：${JSON.stringify(demands.slice(0, 15))}

    請提供一份深度空間策略報告，包含：
    1. 【空間供需現況】：分析資源點與需求密集的地理重疊度。
    2. 【服務缺口分析】：找出哪些行政里（精確到里別）的需求最高但周邊資源最少。
    3. 【具體行動建議】：建議在哪個特定區域（區/里）增加臨時資源點或移動醫療服務。
    4. 【優先級建議】：根據數據給出急迫性排序。

    請以專業、精簡且有洞察力的語氣撰寫，條列呈現。
  `;
  
  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: prompt,
    config: {
      thinkingConfig: { thinkingBudget: 2000 }
    }
  });
  
  return response.text;
};
