import express from "express";
import { healthController } from "../health";
import { directiveController } from "../directive";
import { legacyContactController } from "../legacy_contact";

const apiRoutes = express.Router();
apiRoutes.get("/health", healthController.getHealth);
apiRoutes.use("/directive", directiveController);
apiRoutes.use("/legacy-contact", legacyContactController);

export { apiRoutes };
