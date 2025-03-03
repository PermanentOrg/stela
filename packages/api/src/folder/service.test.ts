import {
  prettifyFolderSortType,
  prettifyFolderType,
  prettifyFolderStatus,
  prettifyFolderView,
} from "./service";
import {
  FolderSortOrder,
  PrettyFolderSortOrder,
  FolderType,
  PrettyFolderType,
  FolderStatus,
  PrettyFolderStatus,
  FolderView,
  PrettyFolderView,
} from "./models";

describe("prettifyFolderType", () => {
  test("should convert sort.display_date_desc to date-descending", () => {
    expect(prettifyFolderSortType(FolderSortOrder.DisplayDateDescending)).toBe(
      PrettyFolderSortOrder.DateDescending
    );
  });

  test("should convert sort.display_date_asc to date-ascending", () => {
    expect(prettifyFolderSortType(FolderSortOrder.DisplayDateAscending)).toBe(
      PrettyFolderSortOrder.DateAscending
    );
  });

  test("should convert sort.type_desc to type-descending", () => {
    expect(prettifyFolderSortType(FolderSortOrder.TypeDescending)).toBe(
      PrettyFolderSortOrder.TypeDescending
    );
  });

  test("should convert sort.type_asc to type-ascending", () => {
    expect(prettifyFolderSortType(FolderSortOrder.TypeDescending)).toBe(
      PrettyFolderSortOrder.TypeDescending
    );
  });

  test("should convert sort.alphabetical_desc to alphabetical-descending", () => {
    expect(prettifyFolderSortType(FolderSortOrder.AlphabeticalDescending)).toBe(
      PrettyFolderSortOrder.AlphabeticalDescending
    );
  });

  test("should convert sort.alphabetical_asc to alphabetical-ascending", () => {
    expect(prettifyFolderSortType(FolderSortOrder.AlphabeticalAscending)).toBe(
      PrettyFolderSortOrder.AlphabeticalAscending
    );
  });

  test("should default to alphabetical-descending", () => {
    expect(prettifyFolderSortType("not_a_sort_order" as FolderSortOrder)).toBe(
      PrettyFolderSortOrder.AlphabeticalDescending
    );
  });
});

describe("prettifyFolderType", () => {
  test("should convert type.folder.app to app", () => {
    expect(prettifyFolderType(FolderType.App)).toBe(PrettyFolderType.App);
  });

  test("should convert type.folder.root.app to app-root", () => {
    expect(prettifyFolderType(FolderType.RootApp)).toBe(
      PrettyFolderType.AppRoot
    );
  });

  test("should convert type.folder.private to private", () => {
    expect(prettifyFolderType(FolderType.Private)).toBe(
      PrettyFolderType.Private
    );
  });

  test("should convert type.folder.root.private to private-root", () => {
    expect(prettifyFolderType(FolderType.RootPrivate)).toBe(
      PrettyFolderType.PrivateRoot
    );
  });

  test("should convert type.folder.public to public", () => {
    expect(prettifyFolderType(FolderType.Public)).toBe(PrettyFolderType.Public);
  });

  test("should convert type.folder.root.public to public-root", () => {
    expect(prettifyFolderType(FolderType.RootPublic)).toBe(
      PrettyFolderType.PublicRoot
    );
  });

  test("should convert type.folder.root.root to root", () => {
    expect(prettifyFolderType(FolderType.RootRoot)).toBe(PrettyFolderType.Root);
  });

  test("should convert type.folder.root.share to share-root", () => {
    expect(prettifyFolderType(FolderType.RootShare)).toBe(
      PrettyFolderType.ShareRoot
    );
  });

  test("should convert deprecated folder types to 'deprecated'", () => {
    expect(prettifyFolderType(FolderType.Share)).toBe(
      PrettyFolderType.Deprecated
    );
  });
});

describe("prettifyFolderStatus", () => {
  test("should convert status.generic.ok to ok", () => {
    expect(prettifyFolderStatus(FolderStatus.Ok)).toBe(PrettyFolderStatus.Ok);
  });

  test("should convert status.folder.copying to copying", () => {
    expect(prettifyFolderStatus(FolderStatus.Copying)).toBe(
      PrettyFolderStatus.Copying
    );
  });

  test("should convert status.folder.moving to moving", () => {
    expect(prettifyFolderStatus(FolderStatus.Moving)).toBe(
      PrettyFolderStatus.Moving
    );
  });

  test("should convert status.generic.deleted to deleted", () => {
    expect(prettifyFolderStatus(FolderStatus.Deleted)).toBe(
      PrettyFolderStatus.Deleted
    );
  });

  test("should default to ok", () => {
    expect(prettifyFolderStatus("not_at_status" as FolderStatus)).toBe(
      PrettyFolderStatus.Ok
    );
  });
});

describe("prettifyFolderView", () => {
  test("should convert folder.view.grid to grid", () => {
    expect(prettifyFolderView(FolderView.Grid)).toBe(PrettyFolderView.Grid);
  });

  test("should convert folder.view.list to list", () => {
    expect(prettifyFolderView(FolderView.List)).toBe(PrettyFolderView.List);
  });

  test("should convert folder.view.timeline to timeline", () => {
    expect(prettifyFolderView(FolderView.Timeline)).toBe(
      PrettyFolderView.Timeline
    );
  });

  test("should convert deprecated views to 'deprecated'", () => {
    expect(prettifyFolderView(FolderView.Gliding)).toBe(
      PrettyFolderView.Deprecated
    );
  });
});
