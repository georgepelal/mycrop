export const soilDataCache: Record<string, any> = {};
export const getCachedSoilData = (lat: number, lng: number) => {
  const key = `${lat.toFixed(3)},${lng.toFixed(3)}`; // 111m resolution
  return soilDataCache[key] || null;
};
export const setCachedSoilData = (lat: number, lng: number, data: any) => {
  const key = `${lat.toFixed(3)},${lng.toFixed(3)}`;
  soilDataCache[key] = data;
};
