import type { Handler, Request, Response } from "express";
import { healthService } from "./service.js";

const getHealth: Handler = async (_: Request, res: Response): Promise<void> => {
	res.json({
		status: await healthService.getHealth(),
	});
};

export const healthController = {
	getHealth,
};
