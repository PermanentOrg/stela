export interface CreateEventRequestBody {
	entity: string;
	action: string;
	version: number;
	entityId: string;
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

export interface CreateEventRequest extends CreateEventRequestBody {
	userSubjectFromAuthToken?: string | undefined;
	userEmailFromAuthToken?: string | undefined;
	adminSubjectFromAuthToken?: string | undefined;
	adminEmailFromAuthToken?: string | undefined;
	ip: string;
}

export interface ChecklistItem {
	id: string;
	title: string;
	completed: boolean;
}
