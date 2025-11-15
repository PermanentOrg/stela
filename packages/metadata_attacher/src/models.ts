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
							| {
									"rdf:RDF": {
										"rdf:Description": EmbeddedMetadata;
									};
							  }
							| undefined;
					};
				};
			};
		};
	};
}

export interface EmbeddedMetadata {
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
}
