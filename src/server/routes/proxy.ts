// Pass-through proxies for the three upstreams that pages used to call
// straight from the browser. Routing them here puts them behind the same
// provenance envelope as every other endpoint, and keeps the app's outbound
// calls in one place. The upstream JSON is returned unchanged, so the pages
// parse exactly what they parsed before.
import { Router } from "express";

export const router = Router();

/** Upstream call with a deadline, so a hung source fails instead of hanging. */
async function fetchUpstream(url: string, timeoutMs = 15000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

function coords(body: Record<string, unknown>) {
  const lat = Number(body.lat);
  const lng = Number(body.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  return { lat, lng };
}

router.post("/api/soilgrids-properties", async (req, res) => {
  const at = coords(req.body ?? {});
  if (!at) {
    return res.status(400).json({ error: "Valid coordinates are required." });
  }
  const properties = ["clay", "sand", "silt", "soc", "phh2o", "bdod"]
    .map((p) => `property=${p}`)
    .join("&");
  const depths = ["0-5cm", "5-15cm", "15-30cm", "30-60cm", "60-100cm", "100-200cm"]
    .map((d) => `depth=${d}`)
    .join("&");
  const url =
    `https://rest.isric.org/soilgrids/v2.0/properties/query` +
    `?lon=${at.lng}&lat=${at.lat}&${properties}&${depths}&value=mean`;

  try {
    const upstream = await fetchUpstream(url);
    if (!upstream.ok) {
      return res.status(502).json({
        error: "ISRIC SoilGrids is unreachable, so there is no soil profile to show.",
        kind: "unavailable",
      });
    }
    res.json(await upstream.json());
  } catch {
    res.status(502).json({
      error: "ISRIC SoilGrids did not respond in time.",
      kind: "unavailable",
    });
  }
});

router.post("/api/nasa-power-daily", async (req, res) => {
  const at = coords(req.body ?? {});
  if (!at) {
    return res.status(400).json({ error: "Valid coordinates are required." });
  }
  const { start, end, parameters } = req.body ?? {};
  if (typeof start !== "string" || typeof end !== "string" || typeof parameters !== "string") {
    return res.status(400).json({ error: "start, end and parameters are required." });
  }
  // Only the shapes the callers use, so this cannot be turned into an open relay.
  if (!/^\d{8}$/.test(start) || !/^\d{8}$/.test(end) || !/^[A-Z0-9_,]+$/.test(parameters)) {
    return res.status(400).json({ error: "Malformed start, end or parameters." });
  }
  const url =
    `https://power.larc.nasa.gov/api/temporal/daily/point` +
    `?parameters=${parameters}&community=AG&longitude=${at.lng}&latitude=${at.lat}` +
    `&start=${start}&end=${end}&format=JSON`;

  try {
    const upstream = await fetchUpstream(url);
    if (!upstream.ok) {
      return res.status(502).json({
        error: "NASA POWER is unreachable, so there is nothing measured to show.",
        kind: "unavailable",
      });
    }
    res.json(await upstream.json());
  } catch {
    res.status(502).json({
      error: "NASA POWER did not respond in time.",
      kind: "unavailable",
    });
  }
});

router.post("/api/open-meteo-forecast", async (req, res) => {
  const at = coords(req.body ?? {});
  if (!at) {
    return res.status(400).json({ error: "Valid coordinates are required." });
  }
  const { query } = req.body ?? {};
  if (typeof query !== "string" || !/^[a-zA-Z0-9_,=&:.-]+$/.test(query)) {
    return res.status(400).json({ error: "Malformed query." });
  }
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${at.lat}&longitude=${at.lng}&${query}`;

  try {
    const upstream = await fetchUpstream(url);
    if (!upstream.ok) {
      return res.status(502).json({
        error: "Open-Meteo is unreachable right now.",
        kind: "unavailable",
      });
    }
    res.json(await upstream.json());
  } catch {
    res.status(502).json({
      error: "Open-Meteo did not respond in time.",
      kind: "unavailable",
    });
  }
});
