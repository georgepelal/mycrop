import express from "express";
import path from "path";
import dotenv from "dotenv";
import { provenance } from "./src/server/provenance";
import "./src/server/routeSources";
import { apiRoutes } from "./src/server/routes";

dotenv.config();

export const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Set up body parsers with limits for custom uploads
app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ limit: "25mb", extended: true }));

// Every /api response carries where its numbers came from. Applied here so a
// handler cannot forget it, and so a failed upstream is always reported as
// unavailable rather than dressed up as a measurement.
app.use(provenance);


// Robust baseline yield & price configurations per crop

// API Endpoint: Perform precision ROI crop predictions and agronomist reviews

// Every /api endpoint, grouped into modules under src/server/routes.
app.use(apiRoutes);

// Kept here so the tests that import it from ../server keep working.
export { generateFallbackChatResponse } from "./src/server/chatFallback";

app.get("/api/health", (req, res) => {
  res.json({ status: "online", service: "MyCrop Precision Calculator" });
});

// Configure Vite or Static Asset routers
async function initializeWebServer() {
  if (process.env.NODE_ENV !== "production") {
    console.log("Setting up client-side Vite asset proxy in development mode...");
    // Imported here rather than at the top: vite is a devDependency and is
    // not present in a production install.
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Serving production bundle from /dist...");
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('/*splat', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`MyCrop App server successfully bound to http://0.0.0.0:${PORT}`);
  });
}

if (process.env.NODE_ENV !== "test") {
  initializeWebServer();
}
