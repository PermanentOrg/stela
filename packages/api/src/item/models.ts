export interface ItemSummary {
	id: string;
	itemType: "folder" | "record";
	displayName: string;
	displayTime: string | null;
	thumbnailUrls: {
		width200: string | null;
		width256: string | null;
		width500: string | null;
		width1000: string | null;
		width2000: string | null;
	};
}
