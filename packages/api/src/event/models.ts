export interface CreateEventRequest {
	userSubjectFromAuthToken?: string | undefined;
	userEmailFromAuthToken?: string | undefined;
	adminSubjectFromAuthToken?: string | undefined;
	adminEmailFromAuthToken?: string | undefined;
	entity: string;
	action: string;
	version: number;
	entityId: string;
	ip: string;
	userAgent?: string | undefined;
	body: {
		[key: string]: unknown;
		analytics?: {
			event: string;
			distinctId: string;
			data: Record<string, unknown>;
		};
	};
}

export interface ChecklistItem {
	id: string;
	title: string;
	completed: boolean;
}
