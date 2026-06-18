import React, { useEffect, useRef, useState } from "react";
import { Layers, HelpCircle, ScanEye } from "lucide-react";

interface SatelliteVisualizerProps {
  ndviValue: number;
  ndwiValue: number;
  soilMoisture: number;
  cropType: string;
  boundary?: { lat: number; lng: number }[];
}

type SatelliteMode = "NDVI" | "NDWI" | "THERMAL" | "VISIBLE";

interface ViewportBounds {
  viewMinLat: number;
  viewMaxLat: number;
  viewMinLng: number;
  viewMaxLng: number;
  viewLatSpan: number;
  viewLngSpan: number;
}

export default function SatelliteVisualizer({
  ndviValue,
  ndwiValue,
  soilMoisture,
  cropType,
  boundary = []
}: SatelliteVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [mode, setMode] = useState<SatelliteMode>("NDVI");
  
  // Ref to hold coordinates dynamically from drawing threads
  const boundsRef = useRef<ViewportBounds>({
    viewMinLat: 41.8462,
    viewMaxLat: 41.8512,
    viewMinLng: -87.9125,
    viewMaxLng: -87.9055,
    viewLatSpan: 0.005,
    viewLngSpan: 0.007
  });

  const [hoveredPixel, setHoveredPixel] = useState<{ x: number; y: number; lat: number; lng: number; value: number } | null>(null);
  const [clickedPixel, setClickedPixel] = useState<{ x: number; y: number; lat: number; lng: number; ndvi: number; moisture: number } | null>(null);

  // Redraw the canvas when mode or inputs change
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Define coordinate projection bounding box based on boundary vertices
    let b: ViewportBounds;
    if (boundary && boundary.length >= 3) {
      let minLat = Infinity, maxLat = -Infinity;
      let minLng = Infinity, maxLng = -Infinity;
      boundary.forEach(v => {
        if (v.lat < minLat) minLat = v.lat;
        if (v.lat > maxLat) maxLat = v.lat;
        if (v.lng < minLng) minLng = v.lng;
        if (v.lng > maxLng) maxLng = v.lng;
      });

      const latSpan = Math.max(0.0005, maxLat - minLat);
      const lngSpan = Math.max(0.0005, maxLng - minLng);

      // Add generous 20% margin padding to center the drawn shape
      const padLat = latSpan * 0.20;
      const padLng = lngSpan * 0.20;

      b = {
        viewMinLat: minLat - padLat,
        viewMaxLat: maxLat + padLat,
        viewMinLng: minLng - padLng,
        viewMaxLng: maxLng + padLng,
        viewLatSpan: latSpan + padLat * 2,
        viewLngSpan: lngSpan + padLng * 2
      };
    } else {
      // Default fallback grid coordinates
      b = {
        viewMinLat: 41.8462,
        viewMaxLat: 41.8512,
        viewMinLng: -87.9125,
        viewMaxLng: -87.9055,
        viewLatSpan: 0.005,
        viewLngSpan: 0.007
      };
    }

    boundsRef.current = b;

    // Clear previous drawing
    ctx.clearRect(0, 0, width, height);

    // Create custom grid with noise based on ndvi / moisture
    const cellSize = 8;
    const rows = height / cellSize;
    const cols = width / cellSize;

    // Static randomized matrix to make vegetation grids look organic
    const matrixNoise: number[][] = [];
    for (let r = 0; r < rows; r++) {
      matrixNoise[r] = [];
      for (let c = 0; c < cols; c++) {
        // Base sine noise waves to create rich geographic contours, rivers, and dry patches
        const val = 0.5 * Math.sin(r / 4) * Math.cos(c / 5) + 
                    0.3 * Math.sin(r / 10 + c / 8) + 
                    0.2 * (Math.sin(r) * Math.cos(c));
        matrixNoise[r][c] = (val + 1) / 2; // Normalize to 0 - 1
      }
    }

    // Draw the simulated land parcel based on selected Satellite Mode
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const noiseValue = matrixNoise[r][c];

        if (mode === "NDVI") {
          // NDVI Biomass Layer: bright lush green for heavy plants, yellow-red for barren/dry patches
          // Blend noise around the specified NDVI input
          const localNdvi = Math.max(0.01, Math.min(0.99, ndviValue + (noiseValue - 0.5) * 0.25));
          let color = "";
          if (localNdvi < 0.2) {
            color = `rgb(${210 - localNdvi * 100}, ${80 + localNdvi * 50}, 50)`; // Red-orange drought
          } else if (localNdvi < 0.45) {
            color = `rgb(${220 - localNdvi * 50}, ${210 - localNdvi * 10}, 80)`; // Yellow transition
          } else if (localNdvi < 0.72) {
            color = `rgb(${110 - (localNdvi - 0.45) * 100}, ${160 + (localNdvi - 0.45) * 100}, 90)`; // Healthy medium green
          } else {
            color = `rgb(${25 - (localNdvi - 0.72) * 50}, ${120 + (localNdvi - 0.72) * 120}, 45)`; // Rich dense dark green
          }
          ctx.fillStyle = color;

        } else if (mode === "NDWI") {
          // NDWI Water Stress Layer: shows irrigation levels/wetness. Vibrant electric blue for damp spots, orange for dry spots
          const localNdwi = Math.max(0.01, Math.min(0.99, ndwiValue + (noiseValue - 0.5) * 0.3));
          let color = "";
          if (localNdwi < 0.25) {
            color = `rgb(224, 130, 68)`; // Dry brown-orange
          } else if (localNdwi < 0.45) {
            color = `rgb(217, 215, 184)`; // Subhumid silt tan
          } else if (localNdwi < 0.75) {
            color = `rgb(${100 - (localNdwi - 0.45) * 100}, ${160 - (localNdwi - 0.45) * 50}, ${180 + (localNdwi - 0.45) * 100})`; // Light aqua
          } else {
            color = `rgb(29, 78, 216)`; // Saturation flood blue
          }
          ctx.fillStyle = color;

        } else if (mode === "THERMAL") {
          // Thermal heat radiation layer: warm colors (yellow, red) for heat, purple/black for cold
          // Lower moisture/biomass retains more heat (yellow)
          const heatFactor = 1 - (soilMoisture / 100 * 0.4) - (ndviValue * 0.4) + (noiseValue - 0.5) * 0.2;
          const heatClamped = Math.max(0.1, Math.min(0.9, heatFactor));
          const rChannel = Math.round(100 + heatClamped * 155);
          const gChannel = Math.round(30 + heatClamped * 120);
          const bChannel = Math.round(180 - heatClamped * 100);
          ctx.fillStyle = `rgb(${rChannel}, ${gChannel}, ${bChannel})`;

        } else {
          // VISIBLE Light Layer: True Color representation of a rich modular farmer's field
          const cropHue = cropType === "Corn" ? 85 : cropType === "Tomatoes" ? 110 : cropType === "Wheat" ? 45 : 120;
          const saturation = 45 + Math.round(ndviValue * 35);
          const lightness = 25 + Math.round(noiseValue * 20);
          if ((c % 5 === 0 && r % 4 !== 0) || (c % 12 === 0)) {
            ctx.fillStyle = `hsl(28, 40%, ${18 + Math.round(noiseValue * 10)}%)`; // Soil row path
          } else {
            ctx.fillStyle = `hsl(${cropHue}, ${saturation}%, ${lightness}%)`; // Vegetation leaf HSL
          }
        }

        ctx.fillRect(c * cellSize, r * cellSize, cellSize, cellSize);
      }
    }

    // Draw some high-resolution overlay grid markers to represent coordinates
    ctx.strokeStyle = "rgba(255,255,255,0.08)";
    ctx.lineWidth = 1;
    for (let c = cellSize * 5; c < width; c += cellSize * 10) {
      ctx.beginPath();
      ctx.moveTo(c, 0);
      ctx.lineTo(c, height);
      ctx.stroke();
    }
    for (let r = cellSize * 5; r < height; r += cellSize * 10) {
      ctx.beginPath();
      ctx.moveTo(0, r);
      ctx.lineTo(width, r);
      ctx.stroke();
    }

    // Draw custom polygon path representing the fence overlay
    if (boundary && boundary.length >= 3) {
      const pToPx = (pt: { lat: number; lng: number }) => {
        const x = ((pt.lng - b.viewMinLng) / b.viewLngSpan) * width;
        const y = ((b.viewMaxLat - pt.lat) / b.viewLatSpan) * height;
        return { x, y };
      };

      ctx.save();
      ctx.strokeStyle = "rgba(255, 255, 255, 0.9)";
      ctx.lineWidth = 3;
      ctx.fillStyle = "rgba(16, 185, 129, 0.18)"; // Highlight green area
      ctx.setLineDash([6, 3]);

      ctx.beginPath();
      const first = pToPx(boundary[0]);
      ctx.moveTo(first.x, first.y);
      for (let i = 1; i < boundary.length; i++) {
        const p = pToPx(boundary[i]);
        ctx.lineTo(p.x, p.y);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      // Plot corner vertex markers
      boundary.forEach((v, idx) => {
        const p = pToPx(v);
        ctx.fillStyle = "#ffffff";
        ctx.strokeStyle = "#16a34a";
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4.5, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();
      });
    } else {
      // Draw simulated default center pivot circle
      ctx.strokeStyle = "rgba(34, 197, 94, 0.25)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(width / 2, height / 2 - 10, 80, 0, 2 * Math.PI);
      ctx.stroke();
    }

  }, [mode, ndviValue, ndwiValue, soilMoisture, cropType, boundary]);

  // Translate client coordinate pixels to true values
  const getCoordinatesAtPixel = (x: number, y: number, width: number, height: number) => {
    const b = boundsRef.current;
    const finalLng = b.viewMinLng + (x / width) * b.viewLngSpan;
    const finalLat = b.viewMaxLat - (y / height) * b.viewLatSpan;
    return { lat: finalLat, lng: finalLng };
  };

  // Handle canvas mouse tracking
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const coords = getCoordinatesAtPixel(x, y, rect.width, rect.height);

    // Mock an environmental value at pixel
    const noiseFactor = Math.sin(x / 40) * Math.cos(y / 30) * 0.15 + 0.5;
    const val = Math.max(0.01, Math.min(0.99, ndviValue + noiseFactor - 0.5));
    
    setHoveredPixel({
      x: Math.round(x),
      y: Math.round(y),
      lat: coords.lat,
      lng: coords.lng,
      value: parseFloat(val.toFixed(2))
    });
  };

  const handleMouseLeave = () => {
    setHoveredPixel(null);
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const coords = getCoordinatesAtPixel(x, y, rect.width, rect.height);
    const noiseFactor = Math.sin(x / 45) * Math.cos(y / 45) * 0.2;
    const finalNdvi = parseFloat(Math.max(0.1, Math.min(0.98, ndviValue + noiseFactor)).toFixed(2));
    const finalMoisture = Math.round(Math.max(10, Math.min(98, soilMoisture + noiseFactor * 60)));

    setClickedPixel({
      x: Math.round(x),
      y: Math.round(y),
      lat: parseFloat(coords.lat.toFixed(6)),
      lng: parseFloat(coords.lng.toFixed(6)),
      ndvi: finalNdvi,
      moisture: finalMoisture,
    });
  };

  return (
    <div className="bg-white border border-gray-200 rounded-3xl overflow-hidden p-6 shadow-sm text-text-dark" id="sat_visualizer_root">
      {/* Visual Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1 px-2 rounded-md bg-brand-green/10 text-brand-green text-xs font-mono font-bold tracking-wider uppercase">
              Multispectral Overlay
            </span>
            <h4 className="font-display font-semibold text-lg text-text-dark">
              Interactive Satellite Imagery Simulator
            </h4>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Toggle multispectral indices. Click the parcel grid to read dynamic localized telemetry.
          </p>
        </div>

        {/* Mode Selector Buttons */}
        <div className="flex flex-wrap items-center bg-gray-50 p-1 rounded-xl border border-gray-200 gap-1 animate-fadeIn">
          {(["NDVI", "NDWI", "THERMAL", "VISIBLE"] as SatelliteMode[]).map((m) => (
            <button
              key={m}
              id={`idx-btn-${m}`}
              onClick={() => setMode(m)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200 cursor-pointer ${
                mode === m
                  ? "bg-white text-brand-green border border-gray-200 shadow-sm"
                  : "text-gray-500 hover:text-text-dark hover:bg-gray-100"
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid View */}
      <div className="relative flex flex-col xl:flex-row gap-6 items-start">
        {/* The Canvas */}
        <div className="relative w-full max-w-full md:max-w-xl mx-auto xl:mx-0 border border-gray-200 rounded-xl overflow-hidden group shadow-sm bg-black">
          <canvas
            id="satellite-grid-canvas"
            ref={canvasRef}
            width={500}
            height={320}
            className="w-full h-auto cursor-crosshair transition-all duration-300 group-hover:brightness-105"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            onClick={handleCanvasClick}
          />

          {/* Render layer tag based on selection */}
          <div className="absolute top-3 left-3 bg-black/75 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/20 text-[10px] font-mono flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span className="font-bold tracking-wide uppercase text-slate-300">
              {mode === "NDVI" ? "NDVI vegetation biomass index" : mode === "NDWI" ? "ndwi vegetation water content" : mode === "THERMAL" ? "soil thermal radiation" : "optical human true-color"}
            </span>
          </div>

          {/* Ambient pixel coordinate preview on hover */}
          {hoveredPixel && (
            <div className="absolute bottom-3 left-3 bg-black/85 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 text-[9px] font-mono text-slate-300 pointer-events-none space-x-1">
              <span className="text-slate-500">BOUNDS TARGETS:</span> 
              <span className="text-brand-green">{hoveredPixel.lat.toFixed(5)}°N, {Math.abs(hoveredPixel.lng).toFixed(4)}°W</span>
              <span className="text-slate-700">|</span>
              <span className="text-emerald-400 font-bold uppercase">{mode}:</span> {hoveredPixel.value}
            </div>
          )}
        </div>

        {/* Legend and interactive click telemetry panel */}
        <div className="flex-1 w-full flex flex-col justify-between h-[320px]">
          {/* Active Legend Dynamic bar */}
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200/60">
            <h5 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
              Color Ramp Index Legend ({mode})
            </h5>
            
            {mode === "NDVI" ? (
              <div>
                <div className="h-3 w-full rounded bg-gradient-to-r from-red-600 via-amber-400 via-emerald-400 to-emerald-700" />
                <div className="flex justify-between text-[10px] font-mono text-gray-500 mt-1.5">
                  <span>0.0 (Barren Land)</span>
                  <span>0.5 (Subhumid)</span>
                  <span>1.0 (Dense Vigor)</span>
                </div>
              </div>
            ) : mode === "NDWI" ? (
              <div>
                <div className="h-3 w-full rounded bg-gradient-to-r from-orange-500 via-stone-200 via-teal-300 to-blue-700" />
                <div className="flex justify-between text-[10px] font-mono text-gray-500 mt-1.5">
                  <span>0.0 (Severe Drought)</span>
                  <span>0.4 (Hydrated)</span>
                  <span>1.0 (Flood / Pond)</span>
                </div>
              </div>
            ) : mode === "THERMAL" ? (
              <div>
                <div className="h-3 w-full rounded bg-gradient-to-r from-blue-900 via-purple-700 via-red-500 to-yellow-300" />
                <div className="flex justify-between text-[10px] font-mono text-gray-500 mt-1.5">
                  <span>Cold (Saturated / Shade)</span>
                  <span>Neutral</span>
                  <span>Hot (Dry Canopy Surface)</span>
                </div>
              </div>
            ) : (
              <div>
                <div className="h-3 w-full rounded bg-gradient-to-r from-[#211b15] via-[#4d6a2f] to-[#123113]" />
                <div className="flex justify-between text-[10px] font-mono text-gray-500 mt-1.5">
                  <span>Clay row paths</span>
                  <span>Crop shoots</span>
                  <span>Optimal Canopy rows</span>
                </div>
              </div>
            )}
            
            <p className="text-[10px] text-gray-450 mt-2 italic">
              *The simulation synthesizes physical solar radiation metrics representing {cropType} crop properties.
            </p>
          </div>

          {/* Interactive Spot-Test Telemetry results */}
          <div className="bg-gray-150/40 p-4 rounded-xl border border-gray-200 flex-1 flex flex-col justify-center mt-3 h-24">
            {clickedPixel ? (
              <div>
                <div className="flex items-center gap-2 mb-2 pb-2 border-b border-gray-250">
                  <ScanEye className="w-4 h-4 text-brand-green" />
                  <h6 className="text-[10px] font-bold uppercase tracking-wider text-brand-green font-display">
                    Interactive Segment Spectrometry Probe
                  </h6>
                </div>
                
                <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                  <div>
                    <span className="text-gray-400 block text-[9px] uppercase font-bold">LATITUDE:</span>
                    <span className="text-text-dark font-bold">{clickedPixel.lat}° N</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[9px] uppercase font-bold">LONGITUDE:</span>
                    <span className="text-text-dark font-bold">{clickedPixel.lng}° W</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-[9px] uppercase font-bold">NDVI Vigor:</span>
                    <span className={`font-extrabold ${clickedPixel.ndvi > 0.6 ? "text-brand-green" : clickedPixel.ndvi > 0.35 ? "text-amber-600" : "text-red-600"}`}>
                      {clickedPixel.ndvi}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-550 block text-[9px] uppercase font-bold">Moisture Saturation:</span>
                    <span className="text-blue-600 font-extrabold">{clickedPixel.moisture}%</span>
                  </div>
                </div>

                <p className="text-[10px] text-gray-600 mt-2 pt-1 border-t border-gray-150 leading-tight">
                  {clickedPixel.ndvi > 0.65 
                    ? "✓ Uniform chlorophyll index detected. Soil structures are safe."
                    : clickedPixel.ndvi > 0.4
                    ? "▲ Slightly low localized vigor. Check irrigation and boundary water flows."
                    : "⚠️ Alert: Severe vegetative stress detected inside segment bounds. Check soil levels."
                  }
                </p>
              </div>
            ) : (
              <div className="text-center py-2 flex flex-col items-center justify-center text-gray-400">
                <HelpCircle className="w-6 h-6 text-gray-400 mb-1.5 stroke-[1.5]" />
                <p className="text-[10px] max-w-xs leading-relaxed font-semibold">
                  {boundary && boundary.length >= 3 
                    ? "Click on any pixel INSIDE or OUTSIDE your custom field perimeter boundary lines to extract target soil spectrometry probes." 
                    : "No field shape plotted yet. Click anywhere on grid to spot-test simulated default coordinates."
                  }
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
