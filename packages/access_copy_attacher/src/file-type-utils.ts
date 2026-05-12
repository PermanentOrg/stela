import { Readable } from "node:stream";

export const detectFileType = async (
	body: Readable,
): Promise<{ ext: string; mime: string } | undefined> => {
	const { fileTypeFromStream } = await import("file-type");
	return await fileTypeFromStream(Readable.toWeb(body));
};
