import express from "express";
import { healthController } from "../health/index.js";
import { directiveController } from "../directive/index.js";
import { legacyContactController } from "../legacy_contact/index.js";
import { accountController } from "../account/index.js";
import { archiveController } from "../archive/index.js";
import { adminController } from "../admin/index.js";
import { storageController } from "../storage/index.js";
import { eventController } from "../event/index.js";
import { promoController } from "../promo/index.js";
import { idpUserController } from "../idpuser/index.js";
import { recordController, recordsController } from "../record/index.js";
import { featureController } from "../feature_flag/index.js";
import { folderController, foldersController } from "../folder/index.js";
import { shareLinkController } from "../share_link/index.js";
import { storagePurchaseController } from "../storage_purchase/index.js";

const apiRoutes = express.Router();
apiRoutes.get("/health", healthController.getHealth);
apiRoutes.use("/directive", directiveController);
apiRoutes.use("/legacy-contact", legacyContactController);
apiRoutes.use("/accounts", accountController);
apiRoutes.use("/account", accountController); // Deprecated path maintained to avoid breaking changes
apiRoutes.use("/archives", archiveController);
apiRoutes.use("/archive", archiveController); // Deprecated path maintained to avoid breaking changes
apiRoutes.use("/admin", adminController);
apiRoutes.use("/billing", storageController); // Deprecated path maintained to avoid breaking changes
apiRoutes.use("/storage", storageController);
apiRoutes.use("/events", eventController);
apiRoutes.use("/event", eventController); // Deprecated path maintained to avoid breaking changes
apiRoutes.use("/promo", promoController);
apiRoutes.use("/idpuser", idpUserController);
apiRoutes.use("/records", recordsController);
apiRoutes.use("/record", recordController); // Deprecated path maintained to avoid breaking changes
apiRoutes.use("/feature-flags", featureController);
apiRoutes.use("/folders", foldersController);
apiRoutes.use("/folder", folderController); // Deprecated path maintained to avoid breaking changes
apiRoutes.use("/share-links", shareLinkController);
apiRoutes.use("/storage-purchases", storagePurchaseController);

export { apiRoutes };
