import { logger } from "@stela/logger";
import { db } from "../database";

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
