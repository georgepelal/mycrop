// utility endpoints, split out of the single server.ts.
import { Router } from "express";

export const router = Router();

router.post("/api/osm-reverse-geocode", async (req, res) => {
  try {
    const { lat, lng } = req.body;
    if (lat === undefined || lng === undefined) {
      return res.status(400).json({ error: "Coordinates are required to match OSM reverse nodes" });
    }
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    let lives = false;
    let displayName = `Geographic Coordinate Node [${latitude.toFixed(4)}, ${longitude.toFixed(4)}]`;
    let addressInfo: any = {};

    try {
      const osmUrl = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`;
      const response = await fetch(osmUrl);
      if (response.ok) {
        const json = await response.json();
        if (json) {
          lives = true;
          displayName = json.city || json.locality || json.principalSubdivision || json.countryName || displayName;
          addressInfo = {
            village: json.locality,
            county: json.principalSubdivision,
            state: json.principalSubdivision,
            country: json.countryName,
            country_code: json.countryCode
          };
        }
      }
    } catch (e) {
      console.warn("OSM Nominatim coordinate geo-lookup failed:", e);
    }

    res.json({
      latitude,
      longitude,
      isLiveOsm: lives,
      displayName,
      address: {
        road: addressInfo.road || "",
        village: addressInfo.village || addressInfo.town || addressInfo.suburb || "",
        county: addressInfo.county || "",
        state: addressInfo.state || "",
        country: addressInfo.country || "",
        countryCode: addressInfo.country_code || "",
        postcode: addressInfo.postcode || ""
      },
      apiCitation: "Location details reverse-geocoded dynamically from OpenStreetMap Nominatim collaborative geographic database."
    });
  } catch (error: any) {
    console.error("OSM geocoding route failed:", error);
    res.status(500).json({ error: "Failed to geolocate coordinates dynamically" });
  }
});

// API Endpoint: GDACS (Global Disaster Alert and Coordination System) Active Hazard Tracker

router.get("/api/client-ip-geolocation", async (req, res) => {
  try {
    let geo: {
      ip: string;
      city: string;
      region: string;
      country: string;
      latitude: number;
      longitude: number;
      timezone: string;
    } | undefined;

    try {
      const response = await fetch("https://ipapi.co/json/");
      if (response.ok) {
        const json = await response.json();
        if (json && json.latitude && json.longitude) {
          geo = {
            ip: json.ip || "unknown",
            city: json.city || "Unknown",
            region: json.region || "Unknown",
            country: json.country_code || "Unknown",
            latitude: parseFloat(json.latitude),
            longitude: parseFloat(json.longitude),
            timezone: json.timezone || "Unknown"
          };
        }
      }
    } catch (e) {
      console.warn("ipapi.co rate limit or DNS failure:", e);
    }

    if (!geo) {
      return res.status(502).json({ error: "Could not resolve your approximate location from the IP geolocation provider." });
    }

    res.json({
      isLiveIpGeo: true,
      geo,
      apiCitation: "Grower local coordinate approximation resolved from client browser session IP using IPAPI geo-distribution indexes."
    });
  } catch {
    res.status(500).json({ error: "Failed to approximate local user location" });
  }
});

// API Endpoint: Live ISS Satellite Overhead Pass Tracker

router.post("/api/iss-current-overhead", async (req, res) => {
  try {
    const { lat, lng } = req.body;
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    // No default location: answering for Ames, Iowa when none was sent
    // would look like an answer for the user's own field.
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return res.status(400).json({ error: "lat and lng are required" });
    }

    let lives = false;
    let iss = {
      latitude: 0,
      longitude: 0,
      altitudeKm: 420,
      velocityKmh: 27600,
      distanceToGrowerKm: 0,
      isNearOverhead: false,
      visibility: "daylight"
    };

    try {
      const response = await fetch("https://api.wheretheiss.at/v1/satellites/25544");
      if (response.ok) {
        const json = await response.json();
        if (json && json.latitude !== undefined && json.longitude !== undefined) {
          lives = true;
          const issLat = parseFloat(json.latitude);
          const issLng = parseFloat(json.longitude);
          
          // Haversine formula to compute great circle distance between grower and ISS footprint
          const R = 6371; // Earth radius in km
          const dLat = (issLat - latitude) * Math.PI / 180;
          const dLng = (issLng - longitude) * Math.PI / 180;
          const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                    Math.cos(latitude * Math.PI / 180) * Math.cos(issLat * Math.PI / 180) *
                    Math.sin(dLng/2) * Math.sin(dLng/2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
          const footprintDistance = R * c;

          // Compute absolute visual distance combining ISS altitude
          const finalDistance = Math.sqrt(footprintDistance * footprintDistance + (json.altitude * json.altitude));

          iss = {
            latitude: issLat,
            longitude: issLng,
            altitudeKm: parseFloat(json.altitude.toFixed(1)),
            velocityKmh: parseFloat(json.velocity.toFixed(1)),
            distanceToGrowerKm: parseFloat(finalDistance.toFixed(1)),
            isNearOverhead: finalDistance < 1200, // Overhead range visibility footprint matches roughly 1200km horizon
            visibility: json.visibility || "unknown"
          };
        }
      }
    } catch (e) {
      console.warn("wheretheiss.at request failed:", e);
    }

    if (!lives) {
      return res.status(502).json({ error: "ISS Satellite tracker service is currently unavailable or returning invalid geometry." });
    }

    res.json({
      isLiveSatellite: lives,
      iss,
      apiCitation: "Real-time satellite orbital footprints and current flight logs parsed from the Open ISS Tracking Telemetry database (wheretheiss.at)."
    });
  } catch {
    res.status(500).json({ error: "Failed to load real-time ISS satellite orbital telemetry" });
  }
});

// API Endpoint: Nager.Date Public Calendar Holidays for labor shifts management

// Copernicus Data Space (CDSE) — the free successor to Sentinel Hub. Same
// request format; OAuth client from
// https://shapps.dataspace.copernicus.eu/dashboard/#/account/settings
const CDSE_TOKEN_URL = "https://identity.dataspace.copernicus.eu/auth/realms/CDSE/protocol/openid-connect/token";
const CDSE_STATS_URL = "https://sh.dataspace.copernicus.eu/api/v1/statistics";
let cdseToken: { token: string; expiresAt: number } | null = null;

async function getCdseToken(): Promise<string> {
  if (cdseToken && Date.now() < cdseToken.expiresAt) return cdseToken.token;
  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: process.env.CDSE_CLIENT_ID as string,
    client_secret: process.env.CDSE_CLIENT_SECRET as string,
  });
  const r = await fetch(CDSE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!r.ok) throw new Error(`CDSE token request failed (${r.status})`);
  const j = await r.json();
  cdseToken = { token: j.access_token, expiresAt: Date.now() + (Number(j.expires_in) - 60) * 1000 };
  return cdseToken.token;
}

// NDVI, NDWI (Gao: NIR vs SWIR — canopy water) and raw B11 SWIR reflectance,
// with cloud (SCL 8/9/10) and cloud shadow (SCL 3) masked out. FLOAT32 so
// negative values over dry soil survive.
const REFLECTANCE_EVALSCRIPT = `//VERSION=3
function setup() {
  return {
    input: [{ bands: ["B04", "B08", "B11", "SCL", "dataMask"] }],
    output: [
      { id: "ndvi", bands: 1, sampleType: "FLOAT32" },
      { id: "ndwi", bands: 1, sampleType: "FLOAT32" },
      { id: "swir", bands: 1, sampleType: "FLOAT32" },
      { id: "dataMask", bands: 1 }
    ]
  };
}
function evaluatePixel(s) {
  let cloud = [3, 8, 9, 10].includes(s.SCL);
  let d1 = s.B08 + s.B04, d2 = s.B08 + s.B11;
  let bad = d1 === 0 || d2 === 0;
  return {
    ndvi: [bad ? 0 : (s.B08 - s.B04) / d1],
    ndwi: [bad ? 0 : (s.B08 - s.B11) / d2],
    swir: [s.B11],
    dataMask: [s.dataMask * (cloud || bad ? 0 : 1)]
  };
}`;

router.post("/api/copernicus-sentinel-reflectance", async (req, res) => {
  try {
    const { lat, lng } = req.body;
    if (lat === undefined || lng === undefined) {
      return res.status(400).json({ error: "Coordinates are required to sample Sentinel-2 reflectance grids" });
    }
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return res.status(400).json({ error: "lat/lng must be numbers" });
    }

    // Until this endpoint had credentials it returned numbers made up from
    // sin(lat, lng). Without credentials it now says so instead.
    if (!process.env.CDSE_CLIENT_ID || !process.env.CDSE_CLIENT_SECRET) {
      return res.status(503).json({
        error: "Sentinel-2 isn't configured on this server (CDSE_CLIENT_ID / CDSE_CLIENT_SECRET). Register a free Copernicus Data Space OAuth client to enable it.",
      });
    }

    // ~70 m square around the point (7x7 Sentinel-2 pixels at 10 m).
    const dLat = 0.0003;
    const dLng = 0.0003 / Math.max(0.1, Math.cos((latitude * Math.PI) / 180));
    const polygon = {
      type: "Polygon",
      coordinates: [[
        [longitude - dLng, latitude - dLat], [longitude + dLng, latitude - dLat],
        [longitude + dLng, latitude + dLat], [longitude - dLng, latitude + dLat],
        [longitude - dLng, latitude - dLat],
      ]],
    };
    const to = new Date();
    const from = new Date(to.getTime() - 30 * 86400000);

    const token = await getCdseToken();
    const r = await fetch(CDSE_STATS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        input: {
          bounds: { geometry: polygon, properties: { crs: "http://www.opengis.net/def/crs/EPSG/0/4326" } },
          data: [{ type: "sentinel-2-l2a" }],
        },
        aggregation: {
          timeRange: { from: from.toISOString(), to: to.toISOString() },
          aggregationInterval: { of: "P1D" },
          evalscript: REFLECTANCE_EVALSCRIPT,
          // resx/resy are in the bounds' CRS units — degrees for EPSG:4326 —
          // so 10 m is converted at this latitude (a bare 10 = 10° pixels).
          resx: 10 / (111320 * Math.max(0.01, Math.cos((latitude * Math.PI) / 180))),
          resy: 10 / 111320,
        },
        calculations: { default: {} },
      }),
    });
    if (!r.ok) {
      return res.status(502).json({ error: `Copernicus Statistical API returned ${r.status}` });
    }
    const json = await r.json();

    const statsOf = (interval: any, id: string) => {
      const st = interval?.outputs?.[id]?.bands?.B0?.stats;
      return st && st.sampleCount > 0 && typeof st.mean === "number" ? st : null;
    };
    // Most recent pass with at least one cloud-free pixel.
    const passes = (Array.isArray(json?.data) ? json.data : [])
      .filter((iv: any) => statsOf(iv, "ndvi") && statsOf(iv, "ndwi") && statsOf(iv, "swir"))
      .sort((x: any, y: any) => String(y.interval?.from).localeCompare(String(x.interval?.from)));
    if (!passes.length) {
      return res.status(404).json({ error: "No cloud-free Sentinel-2 pass over this point in the last 30 days." });
    }
    const latest = passes[0];
    const ndviStats = statsOf(latest, "ndvi");
    const ndvi = parseFloat(ndviStats.mean.toFixed(3));
    const ndwi = parseFloat(statsOf(latest, "ndwi").mean.toFixed(3));
    const swir1Reflectance = parseFloat(statsOf(latest, "swir").mean.toFixed(3));
    const total = ndviStats.sampleCount + (ndviStats.noDataCount || 0);

    res.json({
      latitude,
      longitude,
      isEstimate: false,
      observedOn: String(latest.interval.from).slice(0, 10),
      cloudFreePixelShare: total > 0 ? parseFloat((ndviStats.sampleCount / total).toFixed(2)) : null,
      indexTimeline: {
        ndvi,
        ndwi,
        swir1Reflectance,
        classification: ndvi > 0.6 ? "Dense vegetation" : ndvi > 0.35 ? "Moderate vegetation" : ndvi > 0.1 ? "Sparse vegetation" : "Bare soil, water or built-up",
      },
      recommendedWavelengthsNano: {
        band8_NearInfrared: 842,
        band4_Red: 665,
        band11_Swir: 1610,
      },
      apiCitation: "Mean over a ~70 m square around the point from the latest cloud-free Sentinel-2 L2A pass (last 30 days), via the Copernicus Data Space Statistical API. Clouds and cloud shadow are masked out.",
    });
  } catch (e) {
    console.error("Copernicus reflectance request failed:", e);
    res.status(502).json({ error: "Couldn't reach Copernicus Data Space" });
  }
});

// API Endpoint: USGS Hydro-Climatological Basins and Watershed Rivers Unit Lookup
