export interface MetsMetadata {
	"mets:mets": {
		"mets:amdSec": MetsAdministrativeSection[] | MetsAdministrativeSection;
	};
}

export interface MetsAdministrativeSection {
	"mets:techMD": {
		"mets:mdWrap": {
			"mets:xmlData": {
				"premis:object": {
					"premis:originalName": string;
					"premis:objectCharacteristics": {
						"premis:objectCharacteristicsExtension":
							| EmbeddedMetadata
							| undefined;
					};
				};
			};
		};
	};
}

export interface TrackMetadata {
	StreamKind: string;
	File_Created_Date: string | undefined;
	Recorded_Date: string | undefined;
	Encoded_Date: string | undefined;
}

export interface RdfMetadata {
	"File:MIMEType": string;
	"IPTC:ObjectName": string | undefined;
	"IPTC:Caption-Abstract": string | undefined;
	"IPTC:Keywords":
		| {
				"rdf:Bag": {
					"rdf:li": string[];
				};
		  }
		| undefined;
	"ExifIFD:Title": string | undefined;
	"ExifIFD:UserComment": string | undefined;
	"ExifIFD:Comments": string | undefined;
	"ExifIFD:DateTimeOriginal": string | undefined;
	"ExifIFD:OffsetTimeOriginal": string | undefined;
	"XMP-iptcCore:AltTextAccessibility": string | undefined;
	"QuickTime:CreationDate": string | undefined;
}

export interface EmbeddedMetadata {
	"rdf:RDF": {
		"rdf:Description": RdfMetadata;
	};
	MediaInfo:
		| {
				media: {
					track: TrackMetadata[];
				};
		  }
		| undefined;
}
