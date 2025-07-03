const hostUrl = process.env["LEGACY_BACKEND_HOST_URL"] ?? "";
const authenticationSecret = process.env["LEGACY_BACKEND_SHARED_SECRET"] ?? "";

const transferArchiveOwnership = async (
	recipientEmail: string,
	archiveSlug: string,
	message?: string,
	isLegacyAction?: boolean,
	storageGiftInMB?: number,
): Promise<Response> => {
	const response = await fetch(`${hostUrl}/archive/transferOwnership`, {
		method: "POST",
		headers: {
			"Request-Version": "2",
			"Content-Type": "application/json",
			"X-Permanent-Stela-Shared-Secret": authenticationSecret,
		},
		body: JSON.stringify({
			recipientEmail,
			archiveNbr: archiveSlug,
			storageGiftInMB: storageGiftInMB ?? 0,
			isLegacyAction: isLegacyAction ?? false,
			message: message ?? null,
		}),
	});

	return response;
};

export const legacyClient = { transferArchiveOwnership };
