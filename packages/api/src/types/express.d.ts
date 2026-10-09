import type { RequestMetadata } from "../middleware/models.js";

declare global {
	namespace Express {
		interface Request {
			// Values derived from the request by our middleware (e.g. the authenticated caller)
			metadata?: RequestMetadata;
		}
	}
}
