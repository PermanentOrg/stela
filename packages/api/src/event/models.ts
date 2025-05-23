export interface CreateEventRequest {
	userSubjectFromAuthToken?: string;
	userEmailFromAuthToken?: string;
	adminSubjectFromAuthToken?: string;
	adminEmailFromAuthToken?: string;
	entity: string;
	action: string;
	version: number;
	entityId: string;
	ip: string;
	userAgent?: string;
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
