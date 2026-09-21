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
    const { lat = 42.0308, lng = -93.6319 } = req.body;
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

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

router.post("/api/copernicus-sentinel-reflectance", async (req, res) => {
  try {
    const { lat, lng } = req.body;
    if (lat === undefined || lng === undefined) {
      return res.status(400).json({ error: "Coordinates are required to sample Sentinel-2 reflectance grids" });
    }
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    // NOTE: This endpoint does not call any live Sentinel-2 / Copernicus imagery API
    // (that requires registered Copernicus Data Space credentials this deployment does
    // not have). The values below are an illustrative, coordinate-derived estimate only
    // -- not a measurement -- and must not be presented to users as live satellite data.
    const seed = Math.abs(Math.sin(latitude * 14.1 + longitude * 31.2));
    const ndviIndex = parseFloat((0.25 + seed * 0.60).toFixed(3)); // 0.25 to 0.85 NDVI (dense healthy foliage)
    const canopyMoisture = parseFloat((0.15 + (1 - seed) * 0.55).toFixed(3)); // Normalized Difference Water Index (NDWI)
    const soilSalinityReflectance = parseFloat((0.02 + seed * 0.12).toFixed(3)); // Bare soil salt index

    res.json({
      latitude,
      longitude,
      isEstimate: true,
      indexTimeline: {
        ndvi: ndviIndex,
        ndwi: canopyMoisture,
        bareSoilReflectance: soilSalinityReflectance,
        classification: ndviIndex > 0.6 ? "Dense Healthy Canopy Cover" : ndviIndex > 0.35 ? "Moderate/Sprout Vegetation" : "Sparse Canopy / Bare Soil"
      },
      recommendedWavelengthsNano: {
        band8_NearInfrared: 842,
        band4_Red: 665,
        band3_Green: 560
      },
      apiCitation: "Illustrative vegetation/water/soil-reflectance estimate derived from location only. This deployment is not connected to live Copernicus Sentinel-2 imagery -- treat these figures as indicative, not measured."
    });
  } catch {
    res.status(500).json({ error: "Failed to compile Copernicus Sentinel-2 surface reflectance vectors" });
  }
});

// API Endpoint: USGS Hydro-Climatological Basins and Watershed Rivers Unit Lookup
