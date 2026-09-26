// Mounts every route module. Adding a module here is the only wiring an
// endpoint needs; its source belongs in ../routeSources.ts.
import { Router } from "express";
import { router as ecology } from "./ecology";
import { router as hazards } from "./hazards";
import { router as markets } from "./markets";
import { router as misc } from "./misc";
import { router as proxy } from "./proxy";
import { router as reference } from "./reference";
import { router as season } from "./season";
import { router as soil } from "./soil";
import { router as utility } from "./utility";
import { router as water } from "./water";
import { router as weather } from "./weather";

export const apiRoutes = Router();

apiRoutes.use(ecology);
apiRoutes.use(hazards);
apiRoutes.use(markets);
apiRoutes.use(misc);
apiRoutes.use(proxy);
apiRoutes.use(reference);
apiRoutes.use(season);
apiRoutes.use(soil);
apiRoutes.use(utility);
apiRoutes.use(water);
apiRoutes.use(weather);
