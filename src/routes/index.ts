import express from "express";
import { healthController } from "../health";
import { directiveController } from "../directive";

const apiRoutes = express.Router();
apiRoutes.get("/health", healthController.getHealth);
apiRoutes.use("/directive", directiveController);

export { apiRoutes };
