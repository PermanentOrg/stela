export enum AccessRole {
	Contributor = "access.role.contributor",
	Curator = "access.role.curator",
	Owner = "access.role.owner",
	Viewer = "access.role.viewer",
	Editor = "access.role.editor",
	Manager = "access.role.manager",
}

export enum ArchiveMembershipRole {
	Contributor = "contributor",
	Curator = "curator",
	Owner = "owner",
	Viewer = "viewer",
	Editor = "editor",
	Manager = "manager",
}

export const accessRoleToArchiveMembershipRole = (
	accessRole: AccessRole,
): ArchiveMembershipRole => {
	const mapping: Record<AccessRole, ArchiveMembershipRole> = {
		[AccessRole.Contributor]: ArchiveMembershipRole.Contributor,
		[AccessRole.Curator]: ArchiveMembershipRole.Curator,
		[AccessRole.Owner]: ArchiveMembershipRole.Owner,
		[AccessRole.Viewer]: ArchiveMembershipRole.Viewer,
		[AccessRole.Editor]: ArchiveMembershipRole.Editor,
		[AccessRole.Manager]: ArchiveMembershipRole.Manager,
	};
	return mapping[accessRole];
};

export const archiveMembershipRoleToAccessRole = (
	archiveMembershipRole: ArchiveMembershipRole,
): AccessRole => {
	const mapping: Record<ArchiveMembershipRole, AccessRole> = {
		[ArchiveMembershipRole.Contributor]: AccessRole.Contributor,
		[ArchiveMembershipRole.Curator]: AccessRole.Curator,
		[ArchiveMembershipRole.Owner]: AccessRole.Owner,
		[ArchiveMembershipRole.Viewer]: AccessRole.Viewer,
		[ArchiveMembershipRole.Editor]: AccessRole.Editor,
		[ArchiveMembershipRole.Manager]: AccessRole.Manager,
	};
	return mapping[archiveMembershipRole];
};
