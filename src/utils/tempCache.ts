export const tempDataCache: Record<string, any> = {};
export const getCachedTempData = (lat: number, lng: number) => {
  const key = `${lat.toFixed(2)},${lng.toFixed(2)}`; // 1.1km resolution
  return tempDataCache[key] || null;
};
export const setCachedTempData = (lat: number, lng: number, data: any) => {
  const key = `${lat.toFixed(2)},${lng.toFixed(2)}`;
  tempDataCache[key] = data;
};
