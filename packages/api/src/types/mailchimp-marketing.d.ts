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
			body: { tags: { name: string; status: "active" | "inactive" }[] },
		): Promise<ErrorResponse | null>;
	}
}
