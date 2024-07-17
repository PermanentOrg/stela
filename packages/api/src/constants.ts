export const GB = 1024 * 1024 * 1024;

export const ACCESS_ROLE = {
  Admin: "access.role.admin",
  Contributor: "access.role.contributor",
  Curator: "access.role.curator",
  Editor: "access.role.editor",
  Manager: "access.role.manager",
  Owner: "access.role.owner",
  Viewer: "access.role.viewer",
};

export const EVENT_ACTION = {
  Copy: "copy",
  Create: "create",
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
};

export const EVENT_ACTOR = {
  User: "user",
  Admin: "admin",
  System: "system",
};

export const EVENT_ENTITY = {
  Account: "account",
  Archive: "archive",
  Directive: "directive",
  Folder: "folder",
  LegacyContact: "legacy_contact",
  ProfileItem: "profile_item",
  Record: "record",
};
