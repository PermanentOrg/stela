declare module "@mailchimp/mailchimp_marketing" {
	export function setConfig(config: Config): void;
	export interface Config {
		apiKey?: string | undefined;
		accessToken?: string | undefined;
		server?: string | undefined;
	}
	export interface ErrorResponse {
		type: string;
		title: string;
		status: number;
		detail: string;
		instance: string;
	}

	export namespace lists {
		export function updateListMemberTags(
			listId: string,
			subscriberHash: string,
			body: { tags: Array<{ name: string; status: "active" | "inactive" }> },
		): Promise<ErrorResponse | null>;

		export function getListMemberTags(
			listId: string,
			subscriberHash: string,
		): Promise<{
			tags: Array<{ id: number; name: string; date_added: string }>;
		}>;
	}
}
