import type { NextFunction, Request } from "express";
import {
	extractShareTokenFromHeaders,
	extractUserEmailFromAuthToken,
	verifyUserAuthentication,
	verifyAdminAuthentication,
	verifyUserOrAdminOrDelegatedCallAuthentication,
	extractIp,
	extractUserIsAdminFromAuthToken,
} from "../src/middleware";

export const mockExtractUserEmailFromAuthToken = (mockEmail?: string): void => {
	jest
		.mocked(extractUserEmailFromAuthToken)
		.mockImplementation(
			async (
				req: Request<unknown, unknown, { emailFromAuthToken?: string }>,
				__,
				next: NextFunction,
			) => {
				if (mockEmail !== undefined) {
					req.body.emailFromAuthToken = mockEmail;
				}
				next();
			},
		);
};

export const mockExtractShareTokenFromHeaders = (
	mockShareToken?: string,
): void => {
	jest
		.mocked(extractShareTokenFromHeaders)
		.mockImplementation(
			(
				req: Request<
					unknown,
					unknown,
					{ emailFromAuthToken?: string; shareToken: string | undefined }
				>,
				__,
				next: NextFunction,
			) => {
				if (mockShareToken !== undefined) {
					req.body.shareToken = mockShareToken;
				}
				next();
			},
		);
};

export const mockExtractIp = (ip?: string): void => {
	jest
		.mocked(extractIp)
		.mockImplementation(
			(
				req: Request<unknown, unknown, { ip?: string }>,
				__,
				next: NextFunction,
			) => {
				if (ip !== undefined) {
					req.body.ip = ip;
				}

				next();
			},
		);
};

export const mockVerifyUserAuthentication = (
	mockUserEmail?: string,
	mockUserSubject?: string,
): void => {
	jest.mocked(verifyUserAuthentication).mockImplementation(
		async (
			req: Request<
				unknown,
				unknown,
				{
					emailFromAuthToken?: string | undefined;
					userSubjectFromAuthToken?: string | undefined;
				}
			>,
			__,
			next: NextFunction,
		) => {
			if (mockUserSubject !== undefined) {
				req.body.userSubjectFromAuthToken = mockUserSubject;
			}
			if (mockUserEmail !== undefined) {
				req.body.emailFromAuthToken = mockUserEmail;
			}
			next();
		},
	);
};

export const mockVerifyAdminAuthentication = (
	mockAdminEmail?: string,
	mockAdminSubject?: string,
): void => {
	jest.mocked(verifyAdminAuthentication).mockImplementation(
		async (
			req: Request<
				unknown,
				unknown,
				{
					emailFromAuthToken?: string;
					adminSubjectFromAuthToken?: string;
				}
			>,
			__,
			next: NextFunction,
		) => {
			if (mockAdminSubject !== undefined) {
				req.body.adminSubjectFromAuthToken = mockAdminSubject;
			}
			if (mockAdminEmail !== undefined) {
				req.body.emailFromAuthToken = mockAdminEmail;
			}
			next();
		},
	);
};

export const mockExtractUserIsAdminFromAuthToken = (isAdmin: boolean): void => {
	jest
		.mocked(extractUserIsAdminFromAuthToken)
		.mockImplementation(
			async (
				req: Request<unknown, unknown, { admin?: boolean }>,
				__,
				next: NextFunction,
			) => {
				req.body.admin = isAdmin;
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
	jest
		.mocked(verifyUserOrAdminOrDelegatedCallAuthentication)
		.mockImplementation(
			async (
				req: Request<
					unknown,
					unknown,
					{
						userEmailFromAuthToken?: string | undefined;
						userSubjectFromAuthToken?: string | undefined;
						adminEmailFromAuthToken?: string | undefined;
						adminSubjectFromAuthToken?: string | undefined;
					}
				>,
				__,
				next: NextFunction,
			) => {
				req.body.userEmailFromAuthToken = mockUserEmail;
				req.body.userSubjectFromAuthToken = mockUserSubject;
				req.body.adminEmailFromAuthToken = mockAdminEmail;
				req.body.adminSubjectFromAuthToken = mockAdminSubject;
				next();
			},
		);
};
