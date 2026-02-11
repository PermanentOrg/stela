import express from "express";
import { healthController } from "../health";
import { directiveController } from "../directive";
import { legacyContactController } from "../legacy_contact";
import { accountController } from "../account";
import { archiveController } from "../archive";
import { adminController } from "../admin";
import { storageController } from "../storage";
import { eventController } from "../event";
import { promoController } from "../promo";
import { idpUserController } from "../idpuser";
import { recordController } from "../record";
import { featureController } from "../feature_flag";
import { folderController } from "../folder";
import { shareLinkController } from "../share_link";
import { donationController } from "../donation";

const apiRoutes = express.Router();
apiRoutes.get("/health", healthController.getHealth);
apiRoutes.use("/directive", directiveController);
apiRoutes.use("/legacy-contact", legacyContactController);
apiRoutes.use("/account", accountController);
apiRoutes.use("/archive", archiveController);
apiRoutes.use("/admin", adminController);
apiRoutes.use("/billing", storageController); // Deprecated path maintained to avoid breaking changes
apiRoutes.use("/storage", storageController);
apiRoutes.use("/event", eventController);
apiRoutes.use("/promo", promoController);
apiRoutes.use("/idpuser", idpUserController);
apiRoutes.use("/records", recordController);
apiRoutes.use("/record", recordController); // Deprecated path maintained to avoid breaking changes
apiRoutes.use("/feature-flags", featureController);
apiRoutes.use("/folders", folderController);
apiRoutes.use("/folder", folderController); // Deprecated path maintained to avoid breaking changes
apiRoutes.use("/share-links", shareLinkController);
apiRoutes.use("/donation", donationController);

export { apiRoutes };
