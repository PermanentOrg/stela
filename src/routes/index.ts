import express from "express";
import { healthController } from "../health";

const apiRoutes = express.Router();
apiRoutes.get("/health", healthController.getHealth);

export { apiRoutes };
