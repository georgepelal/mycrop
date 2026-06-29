const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

content = content.replace(/res\.json\(\{\n\s+latitude,\n\s+longitude,\n\s+dates,\n\s+referenceEt0,\n\s+cropCoefficient,\n\s+actualTranspirationMm,\n\s+waterUseEfficiencyKgm3,\n\s+biomassAccretionGm2,\n\s+isLiveWue,\n\s+totalGrowth,/g, `
    const cumulativeEvapotranspirationMm = referenceEt0.reduce((a, b) => a + b, 0);
    const optimalIrrigationMm = actualTranspirationMm.reduce((a, b) => a + b, 0);
    const waterUseEfficiencyRatio = avgWue.toFixed(1);

    res.json({
      latitude,
      longitude,
      times: dates,
      referenceEt0,
      cropCoefficient,
      actualTranspirationMm,
      waterUseEfficiencyKgm3,
      biomassAccretionGm2,
      isLiveWue,
      totalGrowth,
      cumulativeEvapotranspirationMm,
      optimalIrrigationMm,
      waterUseEfficiencyRatio,
      apiCitation: "Data provided by Open-Meteo",`);

fs.writeFileSync('server.ts', content);
console.log("Patched server.ts");
