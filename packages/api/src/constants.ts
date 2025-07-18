export const KB = 1024;
export const GB = KB * KB * KB;

export const ACCESS_ROLE = {
	Admin: "access.role.admin",
	Contributor: "access.role.contributor",
	Curator: "access.role.curator",
	Editor: "access.role.editor",
	Manager: "access.role.manager",
	Owner: "access.role.owner",
	Viewer: "access.role.viewer",
} as const;

export const EVENT_ACTION = {
	Copy: "copy",
	Create: "create",
	Delete: "delete",
	InitiateUpload: "initiate_upload",
	Login: "login",
	Move: "move",
	OpenAccountMenu: "open_account_menu",
	OpenArchiveMenu: "open_archive_menu",
	OpenArchiveProfile: "open_archive_profile",
	OpenArchiveSteward: "open_archive_steward",
	OpenBillingInfo: "open_billing_info",
	OpenLegacyContact: "open_legacy_contact",
	OpenLoginInfo: "open_login_info",
	OpenPromoEntry: "open_promo_entry",
	OpenStorageModal: "open_storage_modal",
	OpenVerifyEmail: "open_verify_email",
	PurchaseStorage: "purchase_storage",
	SkipCreateArchive: "skip_create_archive",
	SkipGoals: "skip_goals",
	SkipWhyPermanent: "skip_why_permanent",
	StartOnboarding: "start_onboarding",
	Submit: "submit",
	SubmitGoals: "submit_goals",
	SubmitPromo: "submit_promo",
	SubmitReasons: "submit_reasons",
	Update: "update",
} as const;

export const EVENT_ACTOR = {
	Admin: "admin",
	System: "system",
	User: "user",
} as const;

export const EVENT_ENTITY = {
	Account: "account",
	AccountArchive: "account_archive",
	Archive: "archive",
	Directive: "directive",
	Folder: "folder",
	LegacyContact: "legacy_contact",
	ProfileItem: "profile_item",
	Record: "record",
} as const;
