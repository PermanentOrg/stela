import express from "express";
import { healthController } from "../health";
import { directiveController } from "../directive";
import { legacyContactController } from "../legacy_contact";
import { accountController } from "../account";
import { archiveController } from "../archive";
import { adminController } from "../admin";

const apiRoutes = express.Router();
apiRoutes.get("/health", healthController.getHealth);
apiRoutes.use("/directive", directiveController);
apiRoutes.use("/legacy-contact", legacyContactController);
apiRoutes.use("/account", accountController);
apiRoutes.use("/archive", archiveController);
apiRoutes.use("/admin", adminController);

export { apiRoutes };
