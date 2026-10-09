import type { NextFunction, Request } from "express";
import { vi } from "vitest";
import {
	extractShareTokenFromHeaders,
	extractUserEmailFromAuthToken,
	verifyUserAuthentication,
	verifyAdminAuthentication,
	verifyUserOrAdminOrDelegatedCallAuthentication,
	extractIp,
	extractUserIsAdminFromAuthToken,
} from "../src/middleware/index.js";
import type * as authentication from "../src/middleware/authentication.js";

const { setAuth } = await vi.importActual<typeof authentication>(
	"../src/middleware/authentication.js",
);

export const mockExtractUserEmailFromAuthToken = (mockEmail?: string): void => {
	vi.mocked(extractUserEmailFromAuthToken).mockImplementation(
		async (req: Request<unknown, unknown, unknown>, __, next: NextFunction) => {
			if (mockEmail !== undefined) {
				setAuth(req, { kind: "user", email: mockEmail });
			}
			next();
		},
	);
};

export const mockExtractShareTokenFromHeaders = (
	mockShareToken?: string,
): void => {
	vi.mocked(extractShareTokenFromHeaders).mockImplementation(
		(req: Request<unknown, unknown, unknown>, __, next: NextFunction) => {
			if (mockShareToken !== undefined) {
				setAuth(req, { shareToken: mockShareToken });
			}
			next();
		},
	);
};

export const mockExtractIp = (ip?: string): void => {
	vi.mocked(extractIp).mockImplementation(
		(req: Request<unknown, unknown, unknown>, __, next: NextFunction) => {
			if (ip !== undefined) {
				req.metadata = { ...req.metadata, clientIp: ip };
			}
			next();
		},
	);
};

export const mockVerifyUserAuthentication = (
	mockUserEmail?: string,
	mockUserSubject?: string,
): void => {
	vi.mocked(verifyUserAuthentication).mockImplementation(
		async (req: Request<unknown, unknown, unknown>, __, next: NextFunction) => {
			setAuth(req, {
				kind: "user",
				email: mockUserEmail,
				subject: mockUserSubject,
			});
			next();
		},
	);
};

export const mockVerifyAdminAuthentication = (
	mockAdminEmail?: string,
	mockAdminSubject?: string,
): void => {
	vi.mocked(verifyAdminAuthentication).mockImplementation(
		async (req: Request<unknown, unknown, unknown>, __, next: NextFunction) => {
			setAuth(req, {
				kind: "admin",
				email: mockAdminEmail,
				subject: mockAdminSubject,
			});
			next();
		},
	);
};

export const mockExtractUserIsAdminFromAuthToken = (isAdmin: boolean): void => {
	vi.mocked(extractUserIsAdminFromAuthToken).mockImplementation(
		async (req: Request<unknown, unknown, unknown>, __, next: NextFunction) => {
			if (isAdmin) {
				setAuth(req, { kind: "admin", email: "admin@permanent.org" });
			}
			next();
		},
	);
};

export const mockVerifyUserOrAdminOrDelegatedCallAuthentication = (
	mockUserEmail: string | undefined,
	mockUserSubject: string | undefined,
	mockAdminEmail: string | undefined,
	mockAdminSubject: string | undefined,
): void => {
	vi.mocked(verifyUserOrAdminOrDelegatedCallAuthentication).mockImplementation(
		async (req: Request<unknown, unknown, unknown>, __, next: NextFunction) => {
			if (mockAdminEmail !== undefined || mockAdminSubject !== undefined) {
				setAuth(req, {
					kind: "admin",
					email: mockAdminEmail,
					subject: mockAdminSubject,
				});
			} else {
				setAuth(req, {
					kind: "user",
					email: mockUserEmail,
					subject: mockUserSubject,
				});
			}
			next();
		},
	);
};
