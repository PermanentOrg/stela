import { db } from "../database";
import { logger } from "../log";

const AVAILABLE = "available";
const UNAVAILABLE = "unavailable";

const getHealth = async (): Promise<"available" | "unavailable"> => {
  try {
    await db.sql("health.queries.ping");
  } catch (error: unknown) {
    logger.error("Error connecting to database:", error);
    return UNAVAILABLE;
  }
  return AVAILABLE;
};

export const healthService = {
  getHealth,
};
