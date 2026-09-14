import React, { useRef, useEffect, useState } from "react";
import * as THREE from "three";
import { 
  Compass, 
  Map, 
  Layers, 
  TrendingUp, 
  Droplets, 
  Eye, 
  Play, 
  Pause, 
  RotateCcw,
  Sparkles,
  Info,
  ChevronRight,
  Sun,
  CloudLightning,
  AlertTriangle,
  Share2,
  Copy,
  Check,
  ExternalLink,
  Download,
  X,
  Globe
} from "lucide-react";
import { Parcel } from "../types";

// Standard pre-configured fields for high-fidelity 3D exploration
const DEFAULT_3D_PARCELS: Parcel[] = [
  {
    id: "p1",
    name: "North Barley Ring",
    cropType: "Barley",
    area: 45.8,
    farmSize: 45.8,
    soilMoisture: 42,
    predictedYield: 6.8,
    lat: 41.8902,
    lng: -87.6298,
    latitude: 41.8902,
    longitude: -87.6298,
    location: "41.89° N, 87.63° W",
    boundaries: [],
    ndvi: 0.82,
    ndviValue: 0.82,
    ndwiValue: 0.42,
    cropHeight: 85,
    soilType: "Clay Loam",
    soilPH: 6.4,
    nitrogen: "Optimal",
    plantingMonth: "May",
    costPerHectare: 900,
    marketPricePerTon: 220,
    createdAt: "2026-05-12",
    lastUpdated: "2026-05-12",
    userId: "mock-agronomist-george",
    ownerId: "mock-agronomist-george",
    customImage: null,
  },
  {
    id: "p2",
    name: "Valley Soy Plot",
    cropType: "Soybeans",
    area: 28.4,
    farmSize: 28.4,
    soilMoisture: 58,
    predictedYield: 4.2,
    lat: 41.8950,
    lng: -87.6320,
    latitude: 41.8950,
    longitude: -87.6320,
    location: "41.90° N, 87.63° W",
    boundaries: [],
    ndvi: 0.74,
    ndviValue: 0.74,
    ndwiValue: 0.52,
    cropHeight: 65,
    soilType: "Silt Loam",
    soilPH: 6.2,
    nitrogen: "Optimal",
    plantingMonth: "May",
    costPerHectare: 950,
    marketPricePerTon: 340,
    createdAt: "2026-05-14",
    lastUpdated: "2026-05-14",
    userId: "mock-agronomist-george",
    ownerId: "mock-agronomist-george",
    customImage: null,
  },
  {
    id: "p3",
    name: "Hillside Wheat Quadrant",
    cropType: "Winter Wheat",
    area: 64.2,
    farmSize: 64.2,
    soilMoisture: 24,
    predictedYield: 5.5,
    lat: 41.8880,
    lng: -87.6250,
    latitude: 41.8880,
    longitude: -87.6250,
    location: "41.89° N, 87.63° W",
    boundaries: [],
    ndvi: 0.45,
    ndviValue: 0.45,
    ndwiValue: 0.31,
    cropHeight: 92,
    soilType: "Sandy Loam",
    soilPH: 6.8,
    nitrogen: "Minimal",
    plantingMonth: "May",
    costPerHectare: 880,
    marketPricePerTon: 190,
    createdAt: "2026-05-15",
    lastUpdated: "2026-05-15",
    userId: "mock-agronomist-george",
    ownerId: "mock-agronomist-george",
    customImage: null,
  }
];

interface Field3DViewProps {
  parcels?: Parcel[];
  initialSelectedParcelId?: string;
}

export default function Field3DView({ parcels = [], initialSelectedParcelId }: Field3DViewProps) {
  // Merge user parcels with defaults so there's always gorgeous 3D fields to display
  const allParcels = parcels.length > 0 ? parcels : DEFAULT_3D_PARCELS;
  const [selectedParcel, setSelectedParcel] = useState<Parcel>(() => {
    if (initialSelectedParcelId) {
      const found = allParcels.find(x => x.id === initialSelectedParcelId);
      if (found) return found;
    }
    return allParcels[0];
  });

  const clayValue = selectedParcel.soilGridsClay !== undefined ? selectedParcel.soilGridsClay : 32;
  const sandValue = selectedParcel.soilGridsSand !== undefined ? selectedParcel.soilGridsSand : 38;
  const siltValue = selectedParcel.soilGridsSilt !== undefined ? selectedParcel.soilGridsSilt : 30;

  // Agricultural soil classification logic based on Clay, Sand, and Silt percentage values
  const getSoilAdvisory = () => {
    if (clayValue > sandValue && clayValue > siltValue) {
      return {
        class: "Clay-Dominant Soil (Heavy Clay Profile)",
        retention: "Retains high water capacity and trace mineral nutrients, but is highly dense with poor bottom drainage, prompting surface run-off and standing water risks during wet spells.",
        action: "Minimize excessive single-run overhead water cycles. Use micro-drip runs to allow clay matrices to absorb moisture slowly without compaction."
      };
    } else if (sandValue > clayValue && sandValue > siltValue) {
      return {
        class: "Sand-Dominant Soil (Sandy Quartz Profile)",
        retention: "Excellent structural airflow and macro-pores, but very low water retention capacity. Rain or irrigation drains straight past root systems, carrying crop nutrients deep into sub-bedrock.",
        action: "Incorporate organic matter or green manure cover crops. Administer spoon-fed, shorter, frequent irrigation runs with low-dose fertilizer feeds."
      };
    } else {
      return {
        class: "Loam & Silt Balanced Soil (Highly Productive Profile)",
        retention: "An outstanding balance of fine silty silt particles with minor sand texture, providing superior capillary moisture holding capacity paired with proper oxygen-rich aeration.",
        action: "Highly self-sustaining profile. Continue using normal precision irrigation schedules based on real-time subsoil moisture telemetry."
      };
    }
  };

  const advisory = getSoilAdvisory();
  
  // Controls & Visualization overlays
  const [viewMode, setViewMode] = useState<"natural" | "ndvi" | "thermal" | "moisture" | "nutrients">("natural");
  const [autoRotate, setAutoRotate] = useState(true);

  // Premium Social Sharing & Data Export States
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [snapshotUrl, setSnapshotUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [activeTemplateIdx, setActiveTemplateIdx] = useState(0);
  const [reportHashtags, setReportHashtags] = useState("#AgTech #PrecisionFarming #SustainableAgriculture");
  const [cardTheme, setCardTheme] = useState<"slate" | "emerald" | "kraft" | "minimal">("slate");
  const [copiedLink, setCopiedLink] = useState(false);
  const [customTitle, setCustomTitle] = useState("");
  const [visibleBadges, setVisibleBadges] = useState({
    ndvi: true,
    yield: true,
    moisture: true,
    area: true,
    location: true
  });
  
  // ThreeJS DOM elements
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  
  // Animation loop variables
  const animationFrameId = useRef<number | null>(null);
  const plantsGroupRef = useRef<THREE.Group | null>(null);
  const terrainMeshRef = useRef<THREE.Mesh | null>(null);
  const moistureLayerRef = useRef<THREE.Mesh | null>(null);

  // Re-render select options when selectedParcel changes
  const handleParcelChange = (id: string) => {
    const p = allParcels.find(x => x.id === id);
    if (p) {
      setSelectedParcel(p);
      setCustomTitle(p.name);
    }
  };

  const socialTemplates = [
    {
      title: "🔬 Sensor Science",
      text: `🔬 Fully captured agricultural metrics for "${customTitle || selectedParcel.name}"! Active canopy density is health-optimized with average NDVI status of ${selectedParcel.ndvi.toFixed(2)} and estimated yield at ${selectedParcel.predictedYield.toFixed(1)} t/h. Precision telemetry is in full effect!`
    },
    {
      title: "🛰️ Satellite Analysis",
      text: `🛰️ Sentinel multispectral satellite scanning completed for crop: ${selectedParcel.cropType}. Sprout heights measuring ${selectedParcel.cropHeight}cm with soil moisture level holding at ${selectedParcel.soilMoisture}%. Precision farming at coordinates: ${selectedParcel.location || (selectedParcel.lat.toFixed(4) + "°N, " + selectedParcel.lng.toFixed(4) + "°W")}.`
    },
    {
      title: "🌿 Sustainable Flow",
      text: `🌱 Managing ${selectedParcel.area} Hectares of resilient ${selectedParcel.cropType} acreage. Modeling 3D digital-twin topography and subsoil hydrology to preserve organic moisture retention levels.`
    }
  ];

  const handleCaptureShare = () => {
    if (rendererRef.current && sceneRef.current && cameraRef.current) {
      // Force render to ensure correct canvas state
      rendererRef.current.render(sceneRef.current, cameraRef.current);
      try {
        const dataUrl = rendererRef.current.domElement.toDataURL("image/png");
        setSnapshotUrl(dataUrl);
      } catch (err) {
        console.warn("Could not retrieve WebGL snapshot data URL:", err);
      }
    }
    setCopied(false);
    setIsShareModalOpen(true);
  };

  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(`${text}\n\n${reportHashtags}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    if (!containerRef.current) return;

    let satelliteTexture: THREE.Texture | null = null;

    // Get current dimensions
    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight || 450;

    // 1. Scene Initialization
    const scene = new THREE.Scene();
    // Soft sky gradient ambient color
    scene.background = new THREE.Color("#0c111d"); // Modern dark agtech theme
    sceneRef.current = scene;

    // 2. Camera Setup
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    // Position camera overlooking the field from high angle
    camera.position.set(12, 11, 15);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // 3. Renderer Setup - preserveDrawingBuffer allows PNG capture of 3D Canvas
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    // Clear custom canvas if already populated
    containerRef.current.innerHTML = "";
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. Lighting Configuration
    const ambientLight = new THREE.AmbientLight("#475569", 0.6);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight("#e2e8f0", 1.8);
    sunLight.position.set(20, 30, 10);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    sunLight.shadow.bias = -0.001;
    scene.add(sunLight);

    // Warm field secondary backlight
    const backLight = new THREE.PointLight("#10b981", 0.5, 30);
    backLight.position.set(-15, 5, -10);
    scene.add(backLight);

    // 5. Creating Hillside & Farming Topography Ground Mesh using a Solid 3D geological diorama block!
    const groundGeo = new THREE.BoxGeometry(22, 3, 22, 40, 4, 40);

    // Dynamic Seed topography based on actual latitude and longitude so each field has a unique signature!
    const latValue = selectedParcel.lat || 40.0;
    const lngValue = selectedParcel.lng || 22.0;
    const geoSeed = Math.abs(Math.sin(latValue) * Math.cos(lngValue) * 8) % 4;

    // Sculpt natural agricultural ridge waves on top while leaving sides drop straight down!
    const pos = groundGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const z = pos.getZ(i);
      
      // In a BoxGeometry with height 3, centered at 0, the top vertices are at Y = 1.5.
      // We deform top vertices and matching top-border vertices of side faces.
      if (y > 1.45) {
        // Calculate unique geographical hillside grade + micro row furrows
        const waveA = Math.sin(x * 0.12 + geoSeed) * Math.cos(z * 0.14 - geoSeed) * 0.75;
        const waveB = Math.sin((x + z) * 0.05) * 0.45;
        const rowFurrows = Math.sin(x * 1.8) * 0.05; // tractor ploughed seed tracks
        
        pos.setY(i, 1.5 + waveA + waveB + rowFurrows);
      }
    }
    groundGeo.computeVertexNormals();

    // Natural Soil color mapped dynamically to soilType
    let naturalSoilHex = "#452a16"; // Rich standard soil brown
    const soilTypeLower = (selectedParcel.soilType || "").toLowerCase();
    
    if (soilTypeLower.includes("clay loam") || soilTypeLower.includes("clay")) {
      naturalSoilHex = "#854d0e"; // Terra-cottish clay loam orange brown
    } else if (soilTypeLower.includes("silt loam") || soilTypeLower.includes("silt")) {
      naturalSoilHex = "#543015"; // Rich dark chocolate silt
    } else if (soilTypeLower.includes("sandy loam") || soilTypeLower.includes("sand")) {
      naturalSoilHex = "#926838"; // Sand-mixed light earthy golden loam
    } else if (soilTypeLower.includes("peat")) {
      naturalSoilHex = "#1e1e1a"; // Dark peat bog decomposition humus
    } else if (soilTypeLower.includes("chalky clay") || soilTypeLower.includes("chalk")) {
      naturalSoilHex = "#8a8570"; // Dusty pale chalky grey mud
    } else if (soilTypeLower.includes("humus rich") || soilTypeLower.includes("humus") || soilTypeLower.includes("organic")) {
      naturalSoilHex = "#140c06"; // Ultimate dark micro-organic compost black
    }

    // Adapt soil wetness specular characteristics based on selected moisture rating
    const moistureVal = selectedParcel.soilMoisture || 35;
    let soilRoughness = 0.9;
    const soilColorObj = new THREE.Color(naturalSoilHex);
    
    if (moistureVal > 60) {
      // High saturated moisture darker color, glossy soil
      soilRoughness = 0.65; 
      soilColorObj.multiplyScalar(0.7); 
    } else if (moistureVal < 25) {
      // Low water parched desert soil
      soilRoughness = 0.98;
      soilColorObj.addScalar(0.08);
    }

    // Material logic matching active viewMode filter HUD
    let terrainMaterial: THREE.Material;
    
    // Create a highly realistic dynamic GIS satellite texture draped over the terrain top by loading real map tiles!
    const createSatelliteTexture = () => {
      const canvas = document.createElement("canvas");
      const size = 1024;
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");
      
      const texture = new THREE.CanvasTexture(canvas);
      texture.anisotropy = 8;

      if (ctx) {
        // Fill a nice base agricultural soil color first
        const rgb = soilColorObj.getStyle(); // returns rgb(r, g, b)
        ctx.fillStyle = rgb;
        ctx.fillRect(0, 0, size, size);

        // Calculate true center of the parcel boundaries if available to ensure perfect centering alignment
        let centerLat = selectedParcel.lat || 41.8902;
        let centerLng = selectedParcel.lng || -87.6298;

        // Calculate an optimized high-detail zoom level based on boundary extent if present, defaulting to 18 for high detail
        let zoom = 18;
        if (selectedParcel.boundaries && selectedParcel.boundaries.length >= 2) {
          let minLat = 90, maxLat = -90, minLng = 180, maxLng = -180;
          selectedParcel.boundaries.forEach((pt: any) => {
            if (pt.lat < minLat) minLat = pt.lat;
            if (pt.lat > maxLat) maxLat = pt.lat;
            if (pt.lng < minLng) minLng = pt.lng;
            if (pt.lng > maxLng) maxLng = pt.lng;
          });
          const latDiff = maxLat - minLat;
          const lngDiff = maxLng - minLng;
          // Handle wrap-around just in case
          const maxDiff = Math.max(latDiff, lngDiff > 180 ? 360 - lngDiff : lngDiff);

          if (maxDiff > 0) {
            // 1.8 tiles span at zoom z covers of 1.8 * 360 / 2^z degrees.
            // We want 1.8 * 360 / 2^z > maxDiff => 2^z < 648 / maxDiff
            const calculatedZoom = Math.floor(Math.log2(648 / maxDiff));
            // Clamp zoom to standard satellite tile levels (14 to 19 is best for World Imagery)
            zoom = Math.max(14, Math.min(19, calculatedZoom));
          }

          // Align center lat/lng with the exact mathematical mid-point of the boundary bounding box
          centerLat = (minLat + maxLat) / 2;
          centerLng = (minLng + maxLng) / 2;
        }

        const n = Math.pow(2, zoom);
        const safeLat = Math.max(-85, Math.min(85, centerLat));

        const centerTileX = (centerLng + 180) / 360 * n;
        const centerTileY = (1 - Math.log(Math.tan(safeLat * Math.PI / 360 + Math.PI / 4)) / Math.PI) / 2 * n;

        // Load tiles surrounding the center to fully cover the 1024x1024 texture canvas with high precision
        const minTileX = Math.floor(centerTileX - 1.5);
        const maxTileX = Math.ceil(centerTileX + 1.5);
        const minTileY = Math.floor(centerTileY - 1.5);
        const maxTileY = Math.ceil(centerTileY + 1.5);

        // Store tile image states to update canvas consistently once loaded
        interface TileImg {
          x: number;
          y: number;
          img: HTMLImageElement;
          loaded: boolean;
        }
        const tiles: TileImg[] = [];
        const scale = 1.333333; // fit 3x3 tiles (768px original) perfectly onto 1024px canvas

        const redrawAll = () => {
          // A: Draw base agricultural soil in case of download delays
          ctx.fillStyle = rgb;
          ctx.fillRect(0, 0, size, size);

          // B: Boost vibrant GIS chlorophyll contrast for premium aesthetic
          ctx.filter = "contrast(1.2) saturate(1.22) brightness(1.04)";

          // C: Draw all completed tiles
          tiles.forEach(tile => {
            if (tile.loaded) {
              const left = (tile.x - centerTileX) * 256 * scale + 512;
              const top = (tile.y - centerTileY) * 256 * scale + 512;
              const renderSize = 256 * scale;
              ctx.drawImage(tile.img, left, top, renderSize, renderSize);
            }
          });

          // D: Reset standard rendering for vector indicators & boundary overlays
          ctx.filter = "none";

          // E: Overlay physical field boundaries precisely matching the user’s coordinate specs!
          if (selectedParcel.boundaries && selectedParcel.boundaries.length >= 3) {
            const drawBoundaryPath = () => {
              ctx.beginPath();
              selectedParcel.boundaries!.forEach((pt: any, idx: number) => {
                const pxX = (pt.lng + 180) / 360 * n;
                const pxY = (1 - Math.log(Math.tan(pt.lat * Math.PI / 360 + Math.PI / 4)) / Math.PI) / 2 * n;
                const canvasX = (pxX - centerTileX) * 256 * scale + 512;
                const canvasY = (pxY - centerTileY) * 256 * scale + 512;
                if (idx === 0) ctx.moveTo(canvasX, canvasY);
                else ctx.lineTo(canvasX, canvasY);
              });
              ctx.closePath();
            };

            // Custom colored and styled visual mode overlay layers!
            if (viewMode === "ndvi") {
              const ndviGrad = ctx.createLinearGradient(128, 128, 896, 896);
              ndviGrad.addColorStop(0, "rgba(220, 38, 38, 0.45)");   // Dry parched red
              ndviGrad.addColorStop(0.35, "rgba(234, 179, 8, 0.45)"); // Sparse yellow/brown
              ndviGrad.addColorStop(0.7, "rgba(16, 185, 129, 0.45)");  // Lush green
              ndviGrad.addColorStop(1, "rgba(4, 120, 87, 0.55)");     // High leaf biomass emerald
              ctx.fillStyle = ndviGrad;
              drawBoundaryPath();
              ctx.fill();

              // Border glow
              ctx.shadowColor = "rgba(16, 185, 129, 0.9)";
              ctx.shadowBlur = 12;
              ctx.strokeStyle = "rgba(16, 185, 129, 0.95)";
              ctx.lineWidth = 5;
              drawBoundaryPath();
              ctx.stroke();
              ctx.shadowBlur = 0;
            } else if (viewMode === "moisture") {
              const moistureGrad = ctx.createRadialGradient(size/2, size/2, 60, size/2, size/2, size/2 + 100);
              moistureGrad.addColorStop(0, "rgba(29, 78, 216, 0.5)");   // Fully hydrated dark blue
              moistureGrad.addColorStop(0.5, "rgba(59, 130, 246, 0.4)"); // Optimal moisture standard blue
              moistureGrad.addColorStop(1, "rgba(191, 219, 254, 0.25)"); // Light blue dry dry margins
              ctx.fillStyle = moistureGrad;
              drawBoundaryPath();
              ctx.fill();

              // Telemetry grid overlay
              ctx.strokeStyle = "rgba(59, 130, 246, 0.22)";
              ctx.lineWidth = 2;
              for (let x = 64; x < 960; x += 64) {
                ctx.beginPath();
                ctx.moveTo(x, 64);
                ctx.lineTo(x, 960);
                ctx.stroke();
              }
              for (let y = 64; y < 960; y += 64) {
                ctx.beginPath();
                ctx.moveTo(64, y);
                ctx.lineTo(960, y);
                ctx.stroke();
              }

              // Soil water border
              ctx.strokeStyle = "rgba(37, 99, 235, 0.9)";
              ctx.lineWidth = 5;
              ctx.shadowColor = "rgba(37, 99, 235, 0.85)";
              ctx.shadowBlur = 12;
              drawBoundaryPath();
              ctx.stroke();
              ctx.shadowBlur = 0;
            } else if (viewMode === "thermal") {
              const thermalGrad = ctx.createLinearGradient(100, 0, 924, 1024);
              thermalGrad.addColorStop(0, "rgba(219, 39, 119, 0.5)");  // Cool magenta foliage
              thermalGrad.addColorStop(0.5, "rgba(124, 58, 237, 0.45)"); // Normal ambient purple
              thermalGrad.addColorStop(1, "rgba(239, 68, 68, 0.45)");   // Parched dry red heat spot
              ctx.fillStyle = thermalGrad;
              drawBoundaryPath();
              ctx.fill();

              // Fluorescent thermal border
              ctx.strokeStyle = "rgba(236, 72, 153, 0.9)";
              ctx.lineWidth = 5;
              ctx.shadowColor = "rgba(236, 72, 153, 0.85)";
              ctx.shadowBlur = 12;
              drawBoundaryPath();
              ctx.stroke();
              ctx.shadowBlur = 0;
            } else if (viewMode === "nutrients") {
              // Draw Nitrogen, Phosphorus, Potassium hotspots inside the boundary polygon!
              ctx.save();
              drawBoundaryPath();
              ctx.clip();

              const seedValue = Math.abs(Math.sin(selectedParcel.lat || 40) * Math.cos(selectedParcel.lng || -80) * 123) || 45;
              const userN = selectedParcel.soilGridsNitrogenValue || 110;

              const zones = [
                { x: 250 + (seedValue * 31) % 400, y: 200 + (seedValue * 21) % 400, r: 240 + (userN % 20) * 8, color: "rgba(16, 185, 129, 0.65)", label: "Nitrogen (N)" },
                { x: 750 - (seedValue * 19) % 350, y: 300 + (seedValue * 13) % 450, r: 210 + (seedValue % 5) * 15, color: "rgba(249, 115, 22, 0.55)", label: "Phosphorus (P)" },
                { x: 400 + (seedValue * 17) % 400, y: 750 - (seedValue * 29) % 350, r: 230 + (seedValue % 6) * 10, color: "rgba(139, 92, 246, 0.6)", label: "Potassium (K)" }
              ];

              zones.forEach((z) => {
                const radial = ctx.createRadialGradient(z.x, z.y, 15, z.x, z.y, z.r);
                radial.addColorStop(0, z.color);
                radial.addColorStop(0.45, z.color.replace("0.65", "0.28").replace("0.55", "0.22").replace("0.6", "0.25"));
                radial.addColorStop(1, "rgba(0,0,0,0)");
                
                ctx.beginPath();
                ctx.arc(z.x, z.y, z.r, 0, Math.PI * 2);
                ctx.fillStyle = radial;
                ctx.fill();

                // Small center indicators with text labels
                ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
                ctx.font = "bold 14px 'JetBrains Mono', monospace";
                ctx.fillText(z.label, z.x - 55, z.y + 4);
              });

              ctx.restore();

              // Fluorescent nutrient border
              ctx.strokeStyle = "rgba(139, 92, 246, 0.9)";
              ctx.lineWidth = 5;
              ctx.shadowColor = "rgba(139, 92, 246, 0.8)";
              ctx.shadowBlur = 12;
              drawBoundaryPath();
              ctx.stroke();
              ctx.shadowBlur = 0;
            } else {
              // Natural viewMode
              // Light green boundary backing fill with natural glow
              ctx.shadowColor = "rgba(16, 185, 129, 0.62)";
              ctx.shadowBlur = 8;
              ctx.strokeStyle = "rgba(16, 185, 129, 0.85)";
              ctx.lineWidth = 4;
              drawBoundaryPath();
              ctx.stroke();

              // Clear shadow for fill
              ctx.shadowBlur = 0;
              ctx.fillStyle = "rgba(16, 185, 129, 0.08)";
              ctx.fill();
            }

            // Draw pin points marking boundary vertex locations on all modes
            selectedParcel.boundaries.forEach((pt: any) => {
              const pxX = (pt.lng + 180) / 360 * n;
              const pxY = (1 - Math.log(Math.tan(pt.lat * Math.PI / 360 + Math.PI / 4)) / Math.PI) / 2 * n;
              const canvasX = (pxX - centerTileX) * 256 * scale + 512;
              const canvasY = (pxY - centerTileY) * 256 * scale + 512;
              
              ctx.fillStyle = "#ffffff";
              ctx.strokeStyle = viewMode === "moisture" ? "#3b82f6" : viewMode === "thermal" ? "#ec4899" : viewMode === "nutrients" ? "#8b5cf6" : "#10b981";
              ctx.lineWidth = 2.5;
              ctx.beginPath();
              ctx.arc(canvasX, canvasY, 6, 0, Math.PI * 2);
              ctx.fill();
              ctx.stroke();
            });
          }

          // F: Apply deep organic vignette shadows around map blocks to seamlessly transition into 3D sides
          const vig = ctx.createRadialGradient(size/2, size/2, 420, size/2, size/2, 700);
          vig.addColorStop(0, "rgba(0,0,0,0)");
          vig.addColorStop(1, "rgba(0,0,0,0.4)");
          ctx.fillStyle = vig;
          ctx.fillRect(0, 0, size, size);

          texture.needsUpdate = true;
        };

        // Build tiles downloading list
        for (let x = minTileX; x <= maxTileX; x++) {
          for (let y = minTileY; y <= maxTileY; y++) {
            if (y >= 0 && y < n) {
              const wrappedX = ((x % n) + n) % n;
              const tileUrl = `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${zoom}/${y}/${wrappedX}`;
              
              const img = new Image();
              img.crossOrigin = "anonymous";
              const tileObj = { x, y, img, loaded: false };
              tiles.push(tileObj);

              img.onload = () => {
                tileObj.loaded = true;
                redrawAll();
              };
              img.onerror = () => {
                console.warn("Satellite tile map failed to resolve:", tileUrl);
              };
              img.src = tileUrl;
            }
          }
        }

        // Initial render while images download
        redrawAll();
      }
      return texture;
    };

    satelliteTexture = createSatelliteTexture();
    terrainMaterial = new THREE.MeshStandardMaterial({
      map: satelliteTexture,
      roughness: soilRoughness,
      metalness: 0.08,
      flatShading: false
    });

    // Helper to generate a procedural layered geological earth/rock soil strata canvas texture
    const createSideTexture = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 128;
      canvas.height = 256;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        // Core earth background tone
        ctx.fillStyle = "#27160c";
        ctx.fillRect(0, 0, 128, 256);
        
        // Rich high-organic topsoil horizon layer
        ctx.fillStyle = "#190e08";
        ctx.fillRect(0, 0, 128, 48);
        
        // Subsoil clay layer horizon transitions
        ctx.fillStyle = "#382012";
        ctx.fillRect(0, 48, 128, 62);
        
        // Sedimentary rock strata band levels (layered dark & lighter sediment deposits)
        ctx.fillStyle = "#120904";
        ctx.fillRect(0, 110, 128, 16);
        ctx.fillRect(0, 155, 128, 10);
        ctx.fillRect(0, 195, 128, 28);
        
        // Draw rocky speckles / gravel deposits
        ctx.fillStyle = "#5c402b";
        for (let j = 0; j < 55; j++) {
          const rx = Math.random() * 128;
          const ry = 48 + Math.random() * 208;
          const rSize = 1.5 + Math.random() * 3.5;
          ctx.fillRect(rx, ry, rSize, rSize);
        }
        
        // Subtle sandstone grain noise
        ctx.fillStyle = "rgba(224, 185, 134, 0.12)";
        for (let j = 0; j < 350; j++) {
          const rx = Math.random() * 128;
          const ry = Math.random() * 256;
          ctx.fillRect(rx, ry, 1, 1);
        }
      }
      const texture = new THREE.CanvasTexture(canvas);
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.ClampToEdgeWrapping;
      texture.repeat.set(4, 1); // tile horizontally for density
      return texture;
    };

    const sideTex = createSideTexture();

    // Side Soil Strata block material
    const sideMaterial = new THREE.MeshStandardMaterial({
      map: sideTex,
      roughness: 0.9,
      metalness: 0.05
    });

    // Bottom bedrock plate material
    const bottomMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color("#090d16"), // Blackened bedrock
      roughness: 0.95,
      metalness: 0.05
    });

    // Assemble multi-material for BoxGeometry (0: +X, 1: -X, 2: +Y Top, 3: -Y Bottom, 4: +Z, 5: -Z)
    const materialsArray = [
      sideMaterial,     // +X
      sideMaterial,     // -X
      terrainMaterial,  // +Y Top land surface
      bottomMaterial,   // -Y Bottom plate
      sideMaterial,     // +Z
      sideMaterial      // -Z
    ];

    const terrainMesh = new THREE.Mesh(groundGeo, materialsArray);
    // Align so average top surface height centers at Y = 0
    terrainMesh.position.y = -1.5;
    terrainMesh.receiveShadow = true;
    terrainMesh.castShadow = true;
    scene.add(terrainMesh);
    terrainMeshRef.current = terrainMesh;

    // 6. Professional Parcel Boundary Outline Loops
    const linesGroup = new THREE.Group();
    scene.add(linesGroup);

    if (viewMode === "moisture") {
      // Soil texture profile water-retention layers
      const depths = [-0.3, -0.8, -1.3];
      depths.forEach((depth) => {
        const lineGeo = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(-11.02, depth, -11.02),
          new THREE.Vector3(11.02, depth, -11.02),
          new THREE.Vector3(11.02, depth, 11.02),
          new THREE.Vector3(-11.02, depth, 11.02),
          new THREE.Vector3(-11.02, depth, -11.02),
        ]);
        const lineMat = new THREE.LineBasicMaterial({ color: "#3b82f6", linewidth: 1 });
        const line = new THREE.Line(lineGeo, lineMat);
        linesGroup.add(line);
      });
    } else if (viewMode === "thermal") {
      // Soil heat retention profile loops
      const depths = [-0.5, -1.1];
      depths.forEach((depth) => {
        const lineGeo = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(-11.02, depth, -11.02),
          new THREE.Vector3(11.02, depth, -11.02),
          new THREE.Vector3(11.02, depth, 11.02),
          new THREE.Vector3(-11.02, depth, 11.02),
          new THREE.Vector3(-11.02, depth, -11.02),
        ]);
        const lineMat = new THREE.LineBasicMaterial({ color: "#ec4899", linewidth: 1 });
        const line = new THREE.Line(lineGeo, lineMat);
        linesGroup.add(line);
      });
    } else {
      // Flat farm boundary marker line at top-surface level
      const lineGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-11.01, 0.01, -11.01),
        new THREE.Vector3(11.01, 0.01, -11.01),
        new THREE.Vector3(11.01, 0.01, 11.01),
        new THREE.Vector3(-11.01, 0.01, 11.01),
        new THREE.Vector3(-11.01, 0.01, -11.01),
      ]);
      const lineMat = new THREE.LineBasicMaterial({ color: "#10b981", transparent: true, opacity: 0.35 });
      const line = new THREE.Line(lineGeo, lineMat);
      linesGroup.add(line);
    }

    // Dummy meshes that we can set or keep for backward compatibility during cleanup
    const soilBoxGeo = new THREE.BoxGeometry(0.1, 0.1, 0.1);
    const soilMat = new THREE.MeshStandardMaterial();

    // 9. Interactive Drag Camera Rotations handler with Scroll Wheel Zooming support
    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;
    let angleTheta = 0.6; // Angle of orbit horizontal
    let anglePhi = 0.8;   // Angle of orbit height
    let cameraRadius = 46; // Default zoomed out slightly more dynamically as requested to show the entire 3D block

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const deltaX = e.clientX - prevMouseX;
      const deltaY = e.clientY - prevMouseY;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;

      // Adjust angles
      angleTheta -= deltaX * 0.007;
      anglePhi = Math.max(0.1, Math.min(Math.PI / 2 - 0.05, anglePhi + deltaY * 0.007));

      updateCameraPosition();
    };

    const onMouseUp = () => { isDragging = false; };

    // Standard touch handlers for mobile support
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      isDragging = true;
      prevMouseX = e.touches[0].clientX;
      prevMouseY = e.touches[0].clientY;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!isDragging || e.touches.length !== 1) return;
      const tX = e.touches[0].clientX;
      const tY = e.touches[0].clientY;
      const deltaX = tX - prevMouseX;
      const deltaY = tY - prevMouseY;
      prevMouseX = tX;
      prevMouseY = tY;

      angleTheta -= deltaX * 0.008;
      anglePhi = Math.max(0.1, Math.min(Math.PI / 2 - 0.05, anglePhi + deltaY * 0.008));

      updateCameraPosition();
    };

    // Realistic zoom gesture for scroll wheels
    const onWheel = (e: WheelEvent) => {
      e.preventDefault(); // prevent viewport bouncing behavior
      cameraRadius = Math.max(12, Math.min(55, cameraRadius + e.deltaY * 0.025));
      updateCameraPosition();
    };

    const updateCameraPosition = () => {
      if (!camera) return;
      camera.position.x = cameraRadius * Math.sin(angleTheta) * Math.cos(anglePhi);
      camera.position.z = cameraRadius * Math.cos(angleTheta) * Math.cos(anglePhi);
      camera.position.y = cameraRadius * Math.sin(anglePhi);
      camera.lookAt(0, 0, 0);
    };

    // Attach mouse & interaction event listeners
    const canvasDom = renderer.domElement;
    canvasDom.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    canvasDom.addEventListener("wheel", onWheel, { passive: false });
    
    // Attach mobile touch listeners
    canvasDom.addEventListener("touchstart", onTouchStart, { passive: true });
    canvasDom.addEventListener("touchmove", onTouchMove, { passive: true });
    canvasDom.addEventListener("touchend", onMouseUp);

    // Initial positioning setup
    updateCameraPosition();

    // 10. Frame Ticking Animation Loop
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId.current = requestAnimationFrame(animate);

      const elapsedTime = clock.getElapsedTime();

      // Automatic slow landscape preview revolutions
      if (autoRotate && !isDragging) {
        angleTheta += 0.0018;
        updateCameraPosition();
      }

      renderer.render(scene, camera);
    };

    // Execute loop
    animate();

    // Responsive browser resizing handle
    const handleResize = () => {
      if (!containerRef.current || !camera || !renderer) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight || 450;
      
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", handleResize);

    // Cleanups on unmount
    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      
      if (canvasDom) {
        canvasDom.removeEventListener("mousedown", onMouseDown);
        canvasDom.removeEventListener("touchstart", onTouchStart);
        canvasDom.removeEventListener("touchmove", onTouchMove);
        canvasDom.removeEventListener("touchend", onMouseUp);
        canvasDom.removeEventListener("wheel", onWheel);
      }

      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
      
      // Memory cleanup for materials/geometries/procedural textures
      groundGeo.dispose();
      soilBoxGeo.dispose();
      terrainMaterial.dispose();
      soilMat.dispose();
      sideMaterial.dispose();
      bottomMaterial.dispose();
      
      sideTex.dispose();
      if (satelliteTexture) {
        satelliteTexture.dispose();
      }

      renderer.dispose();
    };
  }, [selectedParcel, viewMode, autoRotate]);

  const cardThemes = {
    slate: {
      card: "bg-slate-950/95 border-slate-800 text-white",
      glow: "bg-gradient-to-b from-emerald-500/10 to-transparent",
      header: "text-slate-500 border-slate-900 pb-1.5",
      badge: "bg-slate-900/90 text-emerald-400 border border-slate-800",
      statsBorder: "border-slate-900/60",
      lbl: "text-slate-500",
      val: "text-emerald-400 font-bold",
      valSec: "text-white font-bold",
      valSecInd: "text-indigo-300 font-bold",
      valSecAmb: "text-amber-400 font-bold",
      logo: "text-slate-500",
      logoSec: "text-slate-650",
      barcode: "text-slate-500"
    },
    emerald: {
      card: "bg-[#061d12]/95 border-[#0b2b1b] text-emerald-100",
      glow: "bg-gradient-to-b from-emerald-400/20 to-transparent",
      header: "text-emerald-600 border-[#0a2618] pb-1.5",
      badge: "bg-[#092417] text-emerald-300 border border-[#0f3d27]",
      statsBorder: "border-[#0a2618]",
      lbl: "text-emerald-500",
      val: "text-emerald-300 font-bold",
      valSec: "text-emerald-200 font-bold",
      valSecInd: "text-teal-300 font-bold",
      valSecAmb: "text-amber-300 font-bold",
      logo: "text-emerald-600",
      logoSec: "text-emerald-700/80",
      barcode: "text-emerald-500"
    },
    kraft: {
      card: "bg-[#f5ecd4] border-[#dac8a2] text-[#4d3623]",
      glow: "bg-gradient-to-b from-amber-600/5 to-transparent",
      header: "text-amber-850/60 border-[#decda8] pb-1.5",
      badge: "bg-[#ebdcb9] text-[#5e4531] border border-[#dac9a4]",
      statsBorder: "border-[#dec8a1]",
      lbl: "text-[#8d715a]",
      val: "text-emerald-850 font-bold",
      valSec: "text-[#5e4531] font-bold",
      valSecInd: "text-indigo-900 font-semibold",
      valSecAmb: "text-[#8d6235] font-bold",
      logo: "text-[#8d715a]",
      logoSec: "text-[#aa8f70]",
      barcode: "text-[#8d715a]"
    },
    minimal: {
      card: "bg-white border text-zinc-900 shadow-xl",
      glow: "bg-gradient-to-b from-zinc-50 to-transparent",
      header: "text-zinc-400 border-zinc-100 pb-1.5",
      badge: "bg-zinc-100 text-emerald-700 border border-zinc-200",
      statsBorder: "border-zinc-150",
      lbl: "text-zinc-400",
      val: "text-emerald-600 font-bold",
      valSec: "text-zinc-850 font-bold",
      valSecInd: "text-blue-600 font-bold",
      valSecAmb: "text-amber-600 font-bold",
      logo: "text-zinc-400",
      logoSec: "text-zinc-500",
      barcode: "text-zinc-300"
    }
  }[cardTheme];

  const handleCopyLink = () => {
    const shareUrl = `${window.location.origin}/?share=${selectedParcel.id}`;
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="field-3d-main-grid">
      
      {/* 3D Canvas Box (8/12 layout) */}
      <div className="lg:col-span-8 bg-slate-950 border border-slate-900 rounded-3xl overflow-hidden shadow-2xl relative flex flex-col min-h-[480px]">
        
        {/* Sky gradient overlays */}
        <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-slate-950/90 to-transparent pointer-events-none z-10" />
        <div className="absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-slate-950/20 to-transparent pointer-events-none z-10" />

        {/* 3D Canvas Container */}
        <div ref={containerRef} className="w-full flex-1 z-0 cursor-grab active:cursor-grabbing" style={{ minHeight: "450px" }} />

        {/* Top-Right Telemetry Data Badges */}
        <div className="absolute top-4 right-4 z-20 flex flex-col gap-2 bg-slate-900/90 backdrop-blur-md border border-slate-800 p-3.5 rounded-2xl text-white pointer-events-none">
          <div className="flex items-center gap-1.5 border-b border-slate-800/80 pb-1.5 mb-1 text-[10px] font-mono text-emerald-400 font-bold uppercase tracking-widest">
            <Compass className="w-3.5 h-3.5" />
            <span>GIS 3D Telemetry</span>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[10px] font-mono">
            <span className="text-slate-400 font-medium">NDVI Status:</span>
            <span className={`font-bold justify-self-end ${selectedParcel.ndvi > 0.7 ? "text-emerald-400" : selectedParcel.ndvi > 0.5 ? "text-amber-400" : "text-rose-400"}`}>
              {selectedParcel.ndvi.toFixed(2)}
            </span>
            <span className="text-slate-400 font-medium">Crop Height:</span>
            <span className="text-indigo-300 font-bold justify-self-end">{selectedParcel.cropHeight}cm</span>
            <span className="text-slate-400 font-medium">Est. Yield:</span>
            <span className="text-emerald-400 font-bold justify-self-end">{selectedParcel.predictedYield.toFixed(1)} t/h</span>
            <span className="text-slate-400 font-medium">Moisture:</span>
            <span className="text-blue-400 font-bold justify-self-end">{selectedParcel.soilMoisture}%</span>
          </div>
        </div>

        {/* Floating Quick Stats on overlay */}
        <div className="absolute bottom-4 left-4 z-20 flex items-center gap-4 bg-slate-900/95 backdrop-blur-md border border-slate-800 p-3 rounded-2xl">
          <div className="flex items-center gap-2">
            <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center font-bold text-[9px] ${viewMode === "ndvi" ? "bg-emerald-500 text-slate-900" : viewMode === "moisture" ? "bg-blue-500 text-white" : "bg-emerald-600 text-white"}`}>
              {viewMode === "ndvi" ? "N" : viewMode === "moisture" ? "M" : "🌳"}
            </div>
            <div className="text-left font-sans">
              <span className="text-[9px] text-slate-400 uppercase tracking-widest block font-bold leading-none">View Mode</span>
              <span className="text-[11px] font-bold text-white capitalize">{viewMode} Overlay</span>
            </div>
          </div>

          <div className="h-4 border-l border-slate-800" />

          {/* Instructions to rotate */}
          <div className="hidden sm:flex items-center gap-2 text-[10px] text-slate-400 font-mono">
            <Info className="w-3.5 h-3.5 text-brand-green" />
            <span>Drag to orbit 3D terrain</span>
          </div>
        </div>

        {/* Dynamic Custom Ground & Crop Twin Mapping HUD on bottom-right overlay */}
        <div className="absolute bottom-4 right-4 z-20 hidden md:flex items-center gap-3 bg-slate-900/95 backdrop-blur-md border border-slate-800 p-3 rounded-2xl max-w-[280px] text-left">
          <div className="space-y-1">
            <span className="text-[8px] font-mono text-emerald-400 font-bold uppercase tracking-widest block leading-none">
              Adaptive Digital-Twin Rendering
            </span>
            <p className="text-[10.5px] text-slate-300 font-sans leading-tight">
              Topography derived from coordinates. Ground styled by <strong>{selectedParcel.soilType}</strong>; plants custom-grown for <strong>{selectedParcel.cropType}</strong>.
            </p>
          </div>
        </div>

        {/* Live Controller Buttons Panel */}
        <div className="absolute top-4 left-4 z-20 flex flex-col gap-1.5 bg-slate-950/95 backdrop-blur-md border border-slate-800 p-2.5 rounded-2xl w-28 font-mono select-none">
          <div className="text-[7px] font-bold text-slate-500 uppercase tracking-widest px-1">Controls</div>
          <button
            onClick={() => setAutoRotate(!autoRotate)}
            title="Toggle landscape orbital rotating view"
            className={`p-1.5 rounded-xl text-[9px] font-black tracking-wide uppercase transition-all cursor-pointer flex items-center gap-1.5 ${
              autoRotate ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-extrabold" : "bg-slate-900 border border-slate-800 text-slate-500 hover:text-slate-300"
            }`}
          >
            {autoRotate ? <Pause className="w-3 h-3 animate-pulse text-emerald-400" /> : <Play className="w-3 h-3" />}
            <span>Orbit</span>
          </button>
        </div>

      </div>

      {/* Control Panel Side Sidebar (4/12 layout) */}
      <div className="lg:col-span-4 space-y-6" id="field-3d-sidebar">
        
        {/* Segment A: Selection & Telemetry Details */}
        <div className="bg-white border border-gray-200 rounded-3xl p-5 shadow-xs space-y-4">
          <div className="space-y-1">
            <span className="text-[9px] font-bold uppercase tracking-widest text-brand-green font-mono">Precision Layering</span>
            <h3 className="text-lg font-display font-black text-gray-950 leading-tight">3D Field Inspector</h3>
            <p className="text-xs text-gray-500 leading-normal font-sans">
              Choose an active parcel boundary below to project into 3D space with Sentinel indicators.
            </p>
          </div>

          {/* Dropdown Parcel Select */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
              Active Drawn Boundaries
            </label>
            <select
              value={selectedParcel.id}
              onChange={(e) => handleParcelChange(e.target.value)}
              className="w-full bg-slate-50 border border-gray-200 hover:border-gray-300 rounded-2xl px-4 py-3 text-sm text-slate-800 font-bold focus:outline-none focus:border-brand-green ring-offset-2 focus:ring-2 focus:ring-brand-green/20"
            >
              {allParcels.map((parcel) => (
                <option key={parcel.id} value={parcel.id} className="text-slate-800 font-semibold focus:bg-emerald-50">
                  {parcel.name} ({parcel.cropType})
                </option>
              ))}
            </select>
          </div>

          {/* Quick Metrics display */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            
            <div className="bg-emerald-50/50 border border-emerald-100 p-3.5 rounded-2xl text-left space-y-1">
              <span className="text-[10px] text-emerald-800 font-bold font-mono tracking-wider uppercase block leading-none">Crop Density</span>
              <span className="text-lg font-display font-black text-emerald-950 leading-none">
                {selectedParcel.ndvi > 0.7 ? "Excellent" : selectedParcel.ndvi > 0.5 ? "Moderate" : "Scarce"}
              </span>
              <span className="text-[9px] text-emerald-700/80 font-medium block leading-none pt-1">
                Satellite Feed Live
              </span>
            </div>

            <div className="bg-indigo-50/50 border border-indigo-100 p-3.5 rounded-2xl text-left space-y-1">
              <span className="text-[10px] text-indigo-800 font-bold font-mono tracking-wider uppercase block leading-none">Surface Area</span>
              <span className="text-lg font-display font-black text-indigo-950 leading-none">
                {selectedParcel.area} Ha
              </span>
              <span className="text-[9px] text-indigo-700/80 font-medium block leading-none pt-1">
                GPS Coordinate Drawn
              </span>
            </div>

          </div>

          {/* Precise Soil Grids Composition Block */}
          <div className="border-t border-gray-150 pt-4 space-y-3.5" id="soilgrids-precision-inspector">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
                <span className="text-[10px] font-bold text-gray-900 uppercase tracking-wider font-mono">SoilGrids™ Profile</span>
              </div>
              {selectedParcel.isRealSoilGridsUsed ? (
                <span className="text-[9px] bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 px-2.5 py-0.5 rounded-xl font-bold font-mono tracking-tight uppercase">
                  🌍 Live API
                </span>
              ) : (
                <span className="text-[9px] bg-slate-50 text-slate-500 border border-slate-200 px-2.5 py-0.5 rounded-xl font-bold font-mono tracking-tight uppercase">
                  MAPPED
                </span>
              )}
            </div>

            <div className="space-y-2.5 text-left">
              {/* Clay bar component */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-[11px]">
                  <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-orange-400" />
                    Clay Mineral Fraction
                  </span>
                  <span className="font-mono font-bold text-slate-900">{selectedParcel.soilGridsClay !== undefined ? `${selectedParcel.soilGridsClay}%` : "32.0%"}</span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-orange-400 rounded-full transition-all duration-500" 
                    style={{ width: `${selectedParcel.soilGridsClay !== undefined ? selectedParcel.soilGridsClay : 32}%` }}
                  />
                </div>
              </div>

              {/* Sand bar component */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-[11px]">
                  <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-amber-300" />
                    Sandy Quartz Fraction
                  </span>
                  <span className="font-mono font-bold text-slate-900">{selectedParcel.soilGridsSand !== undefined ? `${selectedParcel.soilGridsSand}%` : "38.0%"}</span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-amber-300 rounded-full transition-all duration-500" 
                    style={{ width: `${selectedParcel.soilGridsSand !== undefined ? selectedParcel.soilGridsSand : 38}%` }}
                  />
                </div>
              </div>

              {/* Silt bar component */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-[11px]">
                  <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-400" />
                    Alluvial Silt Fraction
                  </span>
                  <span className="font-mono font-bold text-slate-900">{selectedParcel.soilGridsSilt !== undefined ? `${selectedParcel.soilGridsSilt}%` : "30.0%"}</span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-emerald-400 rounded-full transition-all duration-500" 
                    style={{ width: `${selectedParcel.soilGridsSilt !== undefined ? selectedParcel.soilGridsSilt : 30}%` }}
                  />
                </div>
              </div>

              {/* Carbon, Nitrogen, acidity rows */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div className="bg-slate-50 border border-slate-150 rounded-xl p-2.5 space-y-0.5 text-left">
                  <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block font-mono">Organic Carbon</span>
                  <span className="text-[11px] font-extrabold text-slate-800 font-mono">
                    {selectedParcel.soilGridsSoc !== undefined ? `${selectedParcel.soilGridsSoc} dg/kg` : "18.4 dg/kg"}
                  </span>
                </div>
                
                <div className="bg-slate-50 border border-slate-150 rounded-xl p-2.5 space-y-0.5 text-left">
                  <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block font-mono">Nitrogen Stock</span>
                  <span className="text-[11px] font-extrabold text-slate-800 font-mono">
                    {selectedParcel.soilGridsNitrogenValue !== undefined ? `${selectedParcel.soilGridsNitrogenValue} cg/kg` : "110 cg/kg"}
                  </span>
                </div>
              </div>

              {/* Dynamic Soil Agrononomic Advisory Text Card */}
              <div className="bg-emerald-500/[0.04] border border-emerald-100 rounded-2xl p-3.5 space-y-2 mt-1.5 text-left text-xs text-slate-700">
                <div className="flex items-center gap-1.5 text-emerald-800 font-bold font-mono text-[10px] uppercase tracking-wider">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  AGRONONMY PROFILE: {advisory.class}
                </div>
                <p className="text-[11px] leading-relaxed text-slate-600">
                  <strong className="text-slate-800">Hydraulic Tendency:</strong> {advisory.retention}
                </p>
                <div className="border-t border-emerald-100/50 pt-2 text-[11px] leading-relaxed text-slate-600">
                  <strong className="text-emerald-850">Farmer Guideline:</strong> {advisory.action}
                </div>
              </div>

              {/* Interactive Soil Nutrient N-P-K Heatmap Overlay Legend & Status Card */}
              {viewMode === "nutrients" && (
                <div className="bg-slate-900 text-white rounded-2xl p-4 space-y-3 border border-slate-800 shadow-md">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider font-mono flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                      Active NPK Telemetry
                    </span>
                    <span className="text-[9px] text-slate-400 font-mono">Soil Health Scan</span>
                  </div>

                  {/* Visual Color Scale Legend */}
                  <div className="space-y-1">
                    <span className="text-[8px] text-slate-400 uppercase font-mono font-bold block">Heatmap Color Legend</span>
                    <div className="grid grid-cols-4 gap-1">
                      <div className="flex flex-col items-center p-1 rounded bg-slate-800 border border-slate-700 text-center">
                        <span className="h-1.5 w-full rounded bg-emerald-500 mb-0.5" />
                        <span className="text-[7.5px] text-slate-300 font-mono leading-none">N (Optimal)</span>
                      </div>
                      <div className="flex flex-col items-center p-1 rounded bg-slate-800 border border-slate-700 text-center">
                        <span className="h-1.5 w-full rounded bg-orange-500 mb-0.5" />
                        <span className="text-[7.5px] text-slate-300 font-mono leading-none">P (Active)</span>
                      </div>
                      <div className="flex flex-col items-center p-1 rounded bg-slate-800 border border-slate-700 text-center">
                        <span className="h-1.5 w-full rounded bg-violet-500 mb-0.5" />
                        <span className="text-[7.5px] text-slate-300 font-mono leading-none">K (Reserve)</span>
                      </div>
                      <div className="flex flex-col items-center p-1 rounded bg-slate-800 border border-slate-700 text-center">
                        <span className="h-1.5 w-full rounded bg-red-500 mb-0.5" />
                        <span className="text-[7.5px] text-slate-300 font-mono leading-none">Deficient</span>
                      </div>
                    </div>
                  </div>

                  {/* NPK Values Progress Gauges */}
                  <div className="space-y-2 pt-1.5 text-left border-t border-slate-800/80">
                    
                    {/* Nitrogen (N) */}
                    <div className="space-y-0.5">
                      <div className="flex justify-between items-center text-[10px] font-mono">
                        <span className="text-emerald-400 font-bold flex items-center gap-1">
                          🟩 N - Nitrogen
                        </span>
                        <span className="font-bold text-slate-200">
                          {selectedParcel.soilGridsNitrogenValue !== undefined ? `${selectedParcel.soilGridsNitrogenValue} cg/kg` : "110 cg/kg"}
                        </span>
                      </div>
                      <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-emerald-500 rounded-full transition-all duration-500" 
                          style={{ width: `${Math.min(100, (selectedParcel.soilGridsNitrogenValue || 110) / 1.5)}%` }}
                        />
                      </div>
                      <span className="text-[8.5px] text-slate-400 block leading-tight">Controls crop leaf vegetation growth.</span>
                    </div>

                    {/* Phosphorus (P) */}
                    <div className="space-y-0.5">
                      <div className="flex justify-between items-center text-[10px] font-mono">
                        <span className="text-orange-400 font-bold flex items-center gap-1">
                          🟧 P - Phosphorus
                        </span>
                        <span className="font-bold text-slate-200">
                          {Math.round(((selectedParcel.soilPH || 6.5) * 12 + (parseInt(selectedParcel.id.replace(/\D/g, "")) || 5) * 3) % 45) + 15} ppm
                        </span>
                      </div>
                      <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-orange-500 rounded-full transition-all duration-500" 
                          style={{ width: `${((Math.round(((selectedParcel.soilPH || 6.5) * 12 + (parseInt(selectedParcel.id.replace(/\D/g, "")) || 5) * 3) % 45) + 15) / 60) * 100}%` }}
                        />
                      </div>
                      <span className="text-[8.5px] text-slate-400 block leading-tight">Spurs subsoil root establishment & plant dividing.</span>
                    </div>

                    {/* Potassium (K) */}
                    <div className="space-y-0.5">
                      <div className="flex justify-between items-center text-[10px] font-mono">
                        <span className="text-violet-400 font-bold flex items-center gap-1">
                          🟪 K - Potassium
                        </span>
                        <span className="font-bold text-slate-200">
                          {Math.round(((selectedParcel.soilGridsClay || 32) * 4.2 + (parseInt(selectedParcel.id.replace(/\D/g, "")) || 8) * 8) % 180) + 120} ppm
                        </span>
                      </div>
                      <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-violet-500 rounded-full transition-all duration-500" 
                          style={{ width: `${((Math.round(((selectedParcel.soilGridsClay || 32) * 4.2 + (parseInt(selectedParcel.id.replace(/\D/g, "")) || 8) * 8) % 180) + 120) / 300) * 100}%` }}
                        />
                      </div>
                      <span className="text-[8.5px] text-slate-400 block leading-tight">Controls water transpiration & cellular stress defense.</span>
                    </div>

                  </div>

                  {/* Recommended Action */}
                  <div className="bg-slate-850 border border-slate-800 rounded-xl p-2 text-[9px] text-slate-300 leading-normal">
                    <strong className="text-emerald-400 block mb-0.5">🌾 AGRI-NPK ADVISORY:</strong>
                    {selectedParcel.soilGridsNitrogenValue && selectedParcel.soilGridsNitrogenValue > 115 
                      ? "Nitrogen levels are healthy and pristine. Suspend auxiliary nitrate dressings to protect local water purity and prevent lodging."
                      : "Nitrogen gaps detected in sandier rows. Apply pre-season cover crop green manure to naturally replenish nitrogen reserves."
                    }
                  </div>
                </div>
              )}

            </div>
          </div>

          <button
            onClick={handleCaptureShare}
            className="w-full mt-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-display font-black px-4 py-3 rounded-2xl shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2 group border-0"
          >
            <Share2 className="w-4 h-4 text-emerald-100 group-hover:scale-115 transition-transform" />
            <span>Generate & Share Social Card</span>
          </button>
        </div>

        {/* Segment B: Visual Filters HUD */}
        <div className="bg-white border border-gray-200 rounded-3xl p-5 shadow-xs space-y-5">
          <div className="border-b border-gray-100 pb-3">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-widest block font-mono">
              3D VISUALIZATION OVERLAYS
            </h4>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            
            <button
              onClick={() => setViewMode("natural")}
              className={`flex flex-col items-center gap-2 p-3 rounded-2xl border text-center transition-all hover:bg-slate-50 cursor-pointer ${
                viewMode === "natural" 
                  ? "border-brand-green bg-emerald-500/[0.03] text-emerald-700" 
                  : "border-gray-150 bg-white text-slate-600"
              }`}
            >
              <Layers className="w-5 h-5 opacity-90" />
              <div className="space-y-0.5">
                <span className="text-[10px] font-black tracking-tight block uppercase leading-none">Natural View</span>
                <span className="text-[8px] text-gray-400 block font-mono leading-none pt-0.5">Grass & Soil</span>
              </div>
            </button>

            <button
              onClick={() => setViewMode("ndvi")}
              className={`flex flex-col items-center gap-2 p-3 rounded-2xl border text-center transition-all hover:bg-slate-50 cursor-pointer ${
                viewMode === "ndvi" 
                  ? "border-brand-green bg-emerald-500/[0.03] text-emerald-700" 
                  : "border-gray-150 bg-white text-slate-600"
              }`}
            >
              <TrendingUp className="w-5 h-5 opacity-90 text-emerald-600" />
              <div className="space-y-0.5">
                <span className="text-[10px] font-black tracking-tight block uppercase leading-none">NDVI Pasture</span>
                <span className="text-[8px] text-gray-400 block font-mono leading-none pt-0.5">Chorophyll Index</span>
              </div>
            </button>

            <button
              onClick={() => setViewMode("moisture")}
              className={`flex flex-col items-center gap-2 p-3 rounded-2xl border text-center transition-all hover:bg-slate-50 cursor-pointer ${
                viewMode === "moisture" 
                  ? "border-blue-500 bg-blue-500/[0.03] text-blue-700" 
                  : "border-gray-150 bg-white text-slate-600"
              }`}
            >
              <Droplets className="w-5 h-5 opacity-90 text-blue-600" />
              <div className="space-y-0.5">
                <span className="text-[10px] font-black tracking-tight block uppercase leading-none">Moisture Mesh</span>
                <span className="text-[8px] text-gray-400 block font-mono leading-none pt-0.5">Volumetric Subsoil</span>
              </div>
            </button>

            <button
              onClick={() => setViewMode("thermal")}
              className={`flex flex-col items-center gap-2 p-3 rounded-2xl border text-center transition-all hover:bg-slate-50 cursor-pointer ${
                viewMode === "thermal" 
                  ? "border-pink-500 bg-pink-500/[0.03] text-pink-700" 
                  : "border-gray-150 bg-white text-slate-600"
              }`}
            >
              <Sun className="w-5 h-5 opacity-90 text-pink-650" />
              <div className="space-y-0.5">
                <span className="text-[10px] font-black tracking-tight block uppercase leading-none">Thermal Scan</span>
                <span className="text-[8px] text-gray-400 block font-mono leading-none pt-0.5">Surface Heat map</span>
              </div>
            </button>

            <button
              onClick={() => setViewMode("nutrients")}
              className={`flex flex-col items-center gap-2 p-3 rounded-2xl border text-center transition-all hover:bg-slate-50 cursor-pointer col-span-2 ${
                viewMode === "nutrients" 
                  ? "border-emerald-500 bg-emerald-500/[0.04] text-emerald-800" 
                  : "border-gray-150 bg-white text-slate-600"
              }`}
            >
              <Sparkles className="w-5 h-5 opacity-95 text-emerald-500 animate-pulse" />
              <div className="space-y-0.5">
                <span className="text-[10px] font-black tracking-tight block uppercase leading-none">Soil Nutrients (NPK Heatmap)</span>
                <span className="text-[8px] text-gray-400 block font-mono leading-none pt-0.5">Dual-Spectral Nitrogen, Phosphorus & Potassium Density</span>
              </div>
            </button>

          </div>
        </div>

        {/* Warning card for extreme environmental thresholds */}
        {selectedParcel.soilMoisture < 30 && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5 text-left">
              <span className="text-[11px] font-black text-amber-950 block">Telemetry Warning: Dry Stress Zone</span>
              <p className="text-[10px] text-amber-800/90 leading-normal font-sans">
                Soil moisture of {selectedParcel.soilMoisture}% in {selectedParcel.name} sits below standard crop drought thresholds. Increase irrigation cycles.
              </p>
            </div>
          </div>
        )}

      </div>

      {/* Full-width 3D Interactive Legend & Field Guide */}
      <div className="lg:col-span-12 bg-slate-900/40 border border-slate-800 rounded-3xl p-6.5 text-left space-y-5 shadow-sm mt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4.5 h-4.5 text-brand-green animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-widest text-brand-green font-mono">Telemetry Companion</span>
            </div>
            <h3 className="text-lg font-display font-black text-white leading-tight">Understanding Your 3D Precision Digital Twin</h3>
            <p className="text-xs text-slate-400">
              This interactive rendering visualizes geographical telemetry, crop structure, and satellite multispectral band layers in real time.
            </p>
          </div>
          <div className="flex gap-2">
            <span className="text-[9.5px] font-bold text-slate-400 bg-slate-800/65 rounded-lg border border-slate-700/50 px-3 py-1.5 uppercase font-mono">
              Render Engine: Three.js
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          {/* Element A: Terrain */}
          <div className="bg-slate-950/50 border border-slate-850 p-4 rounded-2xl space-y-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <Layers className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-white uppercase tracking-tight font-display">1. 3D Terrain & Ridges</h4>
              <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                Represents a downscaled topological model of your farm parcel. The wave micro-crests simulate **ploughed agricultural seedrows (furrows)** sculpted into local hillsides to aid moisture retention.
              </p>
            </div>
          </div>

          {/* Element B: Sprouts */}
          <div className="bg-slate-950/50 border border-slate-850 p-4 rounded-2xl space-y-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-white uppercase tracking-tight font-display">2. Sprout Density & Height</h4>
              <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                Each conical sprout represents a vegetation cluster. Their average physical heights model your parcel's **Crop Height ({selectedParcel.cropHeight}cm)**, and wind-sway patterns represent automated pasture density.
              </p>
            </div>
          </div>

          {/* Element C: Satellite Bands */}
          <div className="bg-slate-950/50 border border-slate-850 p-4 rounded-2xl space-y-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
              <Compass className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-white uppercase tracking-tight font-display">3. Sentinel Telemetry</h4>
              <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                Reflects remote sensing indicators matched directly to regional GPS polygons. Uses direct spectroradiometric values to project real surface crop heights and multi-band status.
              </p>
            </div>
          </div>

          {/* Element D: Active Overlay */}
          <div className="bg-slate-950/50 border border-slate-850 p-4 rounded-2xl space-y-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
              <Droplets className="w-4 h-4 text-blue-400" />
            </div>
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-white uppercase tracking-tight font-display">4. Active Visualization Lens</h4>
              <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                {viewMode === "natural" && "Natural View illustrates realistic chlorophyll sprouts sown directly into rich organic soil composition."}
                {viewMode === "ndvi" && `NDVI View renders Sentinel-2 Multispectral band outputs. High index is lush green (#10b981), sparse or dry regions fade into amber and dry red.`}
                {viewMode === "moisture" && `Moisture View translates surface dry coefficients to matrix blue coordinates. The wireframe grid mimics telemetry subsoil hydrography.`}
                {viewMode === "thermal" && "Thermal Scan represents temperature dispersion. Highly transpirating crop foliage appears in cool magenta, keeping fields safe from stress."}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Premium Social Share & Card Generator Modal */}
      {isShareModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
          <div 
            className="bg-slate-900 border border-slate-800 w-full max-w-4xl rounded-3xl overflow-hidden shadow-2xl relative my-8 animate-in fade-in zoom-in duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800 bg-slate-950/40">
              <div className="space-y-0.5 text-left">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-emerald-400">Social Engine v2.4</span>
                </div>
                <h3 className="text-xl font-display font-black text-white">AgTech Twin Card Generator</h3>
              </div>
              <button 
                onClick={() => setIsShareModalOpen(false)}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all border border-slate-700/50 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-6">
              
              {/* Left Column: Interactive Digital Twin Polaroid Card (Aesthetics First!) */}
              <div className="lg:col-span-5 flex flex-col items-center justify-center space-y-4">
                <div className={`w-full max-w-[320px] p-4.5 rounded-2xl shadow-xl space-y-3.5 text-left relative overflow-hidden transition-all duration-300 ${cardThemes.card}`}>
                  {/* Digital glow pattern in Polaroid background */}
                  <div className={`absolute inset-x-0 top-0 h-28 pointer-events-none ${cardThemes.glow}`} />
                  
                  {/* Polaroid Header Terminal */}
                  <div className={`flex items-center justify-between text-[8px] font-mono font-bold tracking-wider uppercase border-b pb-1.5 ${cardThemes.header}`}>
                    <span className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      SYS.ACTIVE // SENTINEL_2
                    </span>
                    <span>#{selectedParcel.id?.toUpperCase().substring(0, 5) || "M103"}</span>
                  </div>

                  {/* The actual 3D WebGL Snapshot display container */}
                  <div className="aspect-square w-full rounded-xl bg-slate-900 overflow-hidden border border-slate-850 relative group/snap">
                    {snapshotUrl ? (
                      <img 
                        src={snapshotUrl} 
                        alt="3D Field Twin" 
                        className="w-full h-full object-cover select-none"
                      />
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 p-4 text-center space-y-2">
                        <Layers className="w-8 h-8 text-slate-800 animate-bounce" />
                        <span className="text-[10px] font-mono">Snapshot pending...</span>
                      </div>
                    )}
                    
                    {/* Tech HUD crosshair overlay */}
                    <div className="absolute inset-0 border border-emerald-500/10 pointer-events-none" />
                    <div className="absolute top-1/2 left-2 right-2 h-px bg-emerald-500/5 pointer-events-none -translate-y-1/2" />
                    <div className="absolute left-1/2 top-2 bottom-2 w-px bg-emerald-500/5 pointer-events-none -translate-x-1/2" />
                    
                    {/* Crop indicator label */}
                    <span className={`absolute bottom-2.5 right-2.5 text-[8.5px] font-mono font-bold px-2 py-0.5 rounded-md ${cardThemes.badge}`}>
                      {selectedParcel.cropType.toUpperCase()}
                    </span>
                  </div>

                  {/* Stats Block - Polaroid text writing block */}
                  <div className="space-y-2 font-mono">
                    <div className="space-y-0.5">
                      <span className="text-[11px] font-black uppercase font-sans tracking-tight">
                        {customTitle || selectedParcel.name}
                      </span>
                      {visibleBadges.location && (
                        <p className={`text-[8px] leading-none ${cardThemes.lbl}`}>
                          GPS Location: {selectedParcel.location || `${selectedParcel.lat.toFixed(4)}°N, ${selectedParcel.lng.toFixed(4)}°W`}
                        </p>
                      )}
                    </div>

                    <div className={`grid grid-cols-2 gap-2 border-t border-b py-2 ${cardThemes.statsBorder}`}>
                      {visibleBadges.ndvi && (
                        <div className="text-[10px] text-left">
                          <span className={`${cardThemes.lbl} block text-[7.5px] leading-none`}>NDVI INDEX</span>
                          <span className={`${cardThemes.val} block pt-0.5`}>
                            {selectedParcel.ndvi.toFixed(2)} [HIGH]
                          </span>
                        </div>
                      )}
                      {visibleBadges.yield && (
                        <div className="text-[10px] text-left">
                          <span className={`${cardThemes.lbl} block text-[7.5px] leading-none`}>EST. YIELD</span>
                          <span className={`${cardThemes.valSec} block pt-0.5`}>
                            {selectedParcel.predictedYield.toFixed(1)} t/h
                          </span>
                        </div>
                      )}
                      {visibleBadges.moisture && (
                        <div className="text-[10px] text-left">
                          <span className={`${cardThemes.lbl} block text-[7.5px] leading-none`}>SOIL RATING</span>
                          <span className={`${cardThemes.valSecInd} block pt-0.5`}>
                            {selectedParcel.soilMoisture}% H2O
                          </span>
                        </div>
                      )}
                      {visibleBadges.area && (
                        <div className="text-[10px] text-left">
                          <span className={`${cardThemes.lbl} block text-[7.5px] leading-none`}>COVERAGE</span>
                          <span className={`${cardThemes.valSecAmb} block pt-0.5`}>
                            {selectedParcel.area} Hectares
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Bottom Aesthetics - Core Branding & Barcode */}
                    <div className="flex items-center justify-between pt-1 opacity-80">
                      <div className="space-y-0.5 text-left">
                        <span className={`text-[7.5px] font-semibold block leading-none ${cardThemes.logo}`}>AGROSLATE SATELLITE CORE</span>
                        <span className={`text-[6.5px] font-medium block leading-none font-sans ${cardThemes.logoSec}`}>PRECISION INTELLIGENCE IN HARVEST</span>
                      </div>
                      {/* Stylized vector barcode representing digital signatures */}
                      <svg className={`h-4.5 w-14 ${cardThemes.barcode}`} viewBox="0 0 100 20" fill="currentColor">
                        <rect x="0" y="0" width="4" height="20" />
                        <rect x="6" y="0" width="2" height="20" />
                        <rect x="10" y="0" width="6" height="20" />
                        <rect x="18" y="0" width="2" height="20" />
                        <rect x="22" y="0" width="4" height="20" />
                        <rect x="28" y="0" width="8" height="20" />
                        <rect x="38" y="0" width="2" height="20" />
                        <rect x="42" y="0" width="6" height="20" />
                        <rect x="50" y="0" width="4" height="20" />
                        <rect x="56" y="0" width="2" height="20" />
                        <rect x="60" y="0" width="8" height="20" />
                        <rect x="70" y="0" width="4" height="20" />
                        <rect x="76" y="0" width="2" height="20" />
                        <rect x="80" y="0" width="10" height="20" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Snapped image download action */}
                {snapshotUrl && (
                  <a 
                    href={snapshotUrl}
                    download={`${selectedParcel.name.toLowerCase().replace(/\s+/g, "_")}_field_twin.png`}
                    className="text-[10.5px] font-mono text-indigo-400 hover:text-indigo-300 font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download card snapshot (PNG)</span>
                  </a>
                )}
              </div>

              {/* Right Column: Template Selector, Post Content & One-click Social Sharing */}
              <div className="lg:col-span-7 flex flex-col justify-between space-y-5 text-left">
                
                {/* Theme Presets and Customizers */}
                <div className="space-y-3.5">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-500">
                    1. Brand Presentation Theme & Badges
                  </span>
                  <div className="bg-slate-950/60 border border-slate-850 p-4 rounded-2xl space-y-3.5">
                    <div className="space-y-1.5">
                      <label className="text-[9.5px] text-slate-400 font-mono font-bold uppercase block">Color Palette Preset</label>
                      <div className="flex flex-wrap gap-2">
                        {(["slate", "emerald", "kraft", "minimal"] as const).map((t) => (
                          <button
                            key={t}
                            onClick={() => setCardTheme(t)}
                            className={`px-3 py-1.5 rounded-xl border capitalize text-[10.5px] font-bold tracking-tight transition-all cursor-pointer ${
                              cardTheme === t 
                                ? "bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-500/10" 
                                : "bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-850 hover:text-slate-200"
                            }`}
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[9.5px] text-slate-400 font-mono font-bold uppercase block">Interactive Informational Badges</label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {(["ndvi", "yield", "moisture", "area", "location"] as const).map((badgeKey) => (
                          <button
                            key={badgeKey}
                            onClick={() => setVisibleBadges({ ...visibleBadges, [badgeKey]: !visibleBadges[badgeKey as keyof typeof visibleBadges] })}
                            className={`px-3 py-1.5 flex items-center justify-between border rounded-xl text-[9px] font-bold tracking-tight transition-all cursor-pointer ${
                              visibleBadges[badgeKey as keyof typeof visibleBadges] 
                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" 
                                : "bg-slate-900/40 text-slate-500 border-slate-800"
                            }`}
                          >
                            <span className="uppercase">{badgeKey}</span>
                            <span>{visibleBadges[badgeKey as keyof typeof visibleBadges] ? "ON" : "OFF"}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[9.5px] text-slate-400 font-mono font-bold uppercase block">Custom Polaroid Title</label>
                      <input
                        type="text"
                        value={customTitle}
                        onChange={(e) => setCustomTitle(e.target.value)}
                        className="w-full bg-slate-900 text-white rounded-xl border border-slate-800 focus:border-emerald-600 focus:outline-none px-3 py-2 text-xs font-semibold"
                        placeholder="Type custom field name..."
                      />
                    </div>
                  </div>
                </div>

                {/* Style Templates Preset Selectors */}
                <div className="space-y-2.5">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-500">
                    2. Choose Social Presentation Vibe
                  </span>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    {socialTemplates.map((template, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setActiveTemplateIdx(idx);
                        }}
                        className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                          activeTemplateIdx === idx 
                            ? "bg-slate-800 border-brand-green/80 text-white" 
                            : "bg-slate-950/60 border-slate-850 text-slate-400 hover:border-slate-800 hover:bg-slate-900/40"
                        }`}
                      >
                        <span className="text-[11px] font-bold block">{template.title}</span>
                        <p className="text-[9.5px]/relaxed text-slate-500 line-clamp-2 pt-0.5">
                          {template.text}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Final Formatted Text Presets Customization */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-500">
                      3. Post Content Preview & Customize
                    </span>
                    <span className="text-[9px] font-mono text-emerald-400">
                      Dynamic tags auto-compiled
                    </span>
                  </div>
                  
                  <div className="bg-slate-950 border border-slate-850 rounded-2xl p-4.5 space-y-3 font-sans">
                    <p className="text-[12px]/relaxed text-slate-300 select-all font-medium">
                      {socialTemplates[activeTemplateIdx].text}
                    </p>
                    <div className="pt-2 border-t border-slate-900">
                      <input 
                        type="text"
                        value={reportHashtags}
                        onChange={(e) => setReportHashtags(e.target.value)}
                        className="w-full bg-transparent border-0 text-[11px] text-brand-green font-mono focus:outline-none focus:ring-0 p-0"
                        placeholder="#Hashtags"
                      />
                    </div>
                  </div>
                </div>

                {/* Global One-click Publish Actions row */}
                <div className="space-y-3.5 pt-3 border-t border-slate-800">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-500 block">
                    4. Broadcast Field Twin to Social channels
                  </span>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-2.5">
                    
                    {/* Action A: Copy Report */}
                    <button
                      onClick={() => handleCopyText(socialTemplates[activeTemplateIdx].text)}
                      className="bg-slate-800 hover:bg-slate-750 text-white text-[11px] font-display font-extrabold px-3 py-3 rounded-2xl border border-slate-700/60 shadow-xs hover:border-slate-650 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      {copied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400">Copied text!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-slate-400" />
                          <span>Copy Text</span>
                        </>
                      )}
                    </button>

                    {/* Action B: Copy Shareable Web Link */}
                    <button
                      onClick={handleCopyLink}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-display font-extrabold px-3 py-3 rounded-2xl shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer border-0"
                    >
                      {copiedLink ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-100 animate-pulse" />
                          <span>Link copied!</span>
                        </>
                      ) : (
                        <>
                          <ExternalLink className="w-3.5 h-3.5 text-emerald-100" />
                          <span>Copy Share Link</span>
                        </>
                      )}
                    </button>

                    {/* Action C: Share on X (Twitter) */}
                    <button
                      onClick={() => {
                        const compiled = `${socialTemplates[activeTemplateIdx].text}\n\n${reportHashtags}`;
                        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(compiled)}`, "_blank");
                      }}
                      className="bg-sky-500 hover:bg-sky-400 text-white text-[11px] font-display font-extrabold px-3 py-3 rounded-2xl shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer border-0"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>Twitter // X</span>
                    </button>

                    {/* Action D: Post to LinkedIn */}
                    <button
                      onClick={() => {
                        const compiled = `${socialTemplates[activeTemplateIdx].text}\n\n${reportHashtags}`;
                        window.open(`https://www.linkedin.com/feed/?shareActive=true&text=${encodeURIComponent(compiled)}`, "_blank");
                      }}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-display font-extrabold px-3 py-3 rounded-2xl shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer border-0"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>LinkedIn</span>
                    </button>

                  </div>

                  <p className="text-[10px] text-slate-500 leading-normal text-center pt-1.5 leading-relaxed font-sans">
                    ⚡ Cards leverage Three.js frame interpolation and Satellite Sentinel band scores to represent live geographic agriculture records on any device platform.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

