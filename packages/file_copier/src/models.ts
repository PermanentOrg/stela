export interface FileCopyEvent {
	id: string;
	entity: "file";
	action: "copy";
	body: {
		file: {
			fileid: number;
			cloudpath: string;
		};
		newFile: {
			fileid: number;
			cloudpath: string;
		};
	};
}
