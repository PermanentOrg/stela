export interface RequestAuth {
	kind?: "user" | "admin" | undefined;
	email?: string | undefined;
	subject?: string | undefined;
	shareToken?: string | undefined;
}

export interface RequestMetadata {
	auth?: RequestAuth | undefined;
	clientIp?: string | undefined;
}
