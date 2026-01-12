
export interface ResourceItem {
  id: string;
  name: string;
  address: string;
  capacity: number;
  lat: number;
  lng: number;
}

export interface DemandItem {
  id: string;
  district: string;
  village: string;
  count: number;
  lat: number;
  lng: number;
}

export interface MapData {
  resources: ResourceItem[];
  demands: DemandItem[];
}

export enum LayerType {
  RESOURCE = 'RESOURCE',
  DEMAND = 'DEMAND'
}

export interface GeocodeResult {
  lat: number;
  lng: number;
}
