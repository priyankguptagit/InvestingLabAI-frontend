export interface IndiaData {
  [stateCode: string]: {
    name: string;
    cities: string[];
  };
}

export interface StateOption {
  value: string;
  label: string;
}

export interface CityOption {
  value: string;
  label: string;
}

let cachedData: IndiaData | null = null;

export async function getIndiaData(): Promise<IndiaData> {
  if (cachedData) {
    return cachedData;
  }
  
  try {
    const response = await fetch('/india-data.json');
    if (!response.ok) {
      throw new Error('Failed to load india-data.json');
    }
    const data: IndiaData = await response.json();
    cachedData = data;
    return data;
  } catch (err) {
    console.error('Error fetching india-data.json:', err);
    return {};
  }
}

export function getStates(data: IndiaData): StateOption[] {
  return Object.keys(data).map(code => ({
    value: code,
    label: data[code].name,
  })).sort((a, b) => a.label.localeCompare(b.label));
}

export function getCities(data: IndiaData, stateCode: string): CityOption[] {
  if (!stateCode || !data[stateCode]) return [];
  
  return data[stateCode].cities.map(city => ({
    value: city,
    label: city,
  }));
}
