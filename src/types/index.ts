export type ColorBucket =
  | "red"
  | "orange"
  | "yellow"
  | "green"
  | "blue"
  | "purple"
  | "pink"
  | "grayscale";

export interface Release {
  id: number;
  title: string;
  artist: string;
  year: number;
  genres: string[];
  styles: string[];
  thumb: string;
  coverImage: string;
  masterId?: number;
  originalYear?: number | null;
  color?: ColorBucket | null;
  dateAdded?: string;
}

export interface Rectangle {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  locked: boolean;
  releaseId?: number;
  coverImage?: string;
}

export type MasterFetchStatus = "idle" | "confirming" | "fetching" | "done";

export type SortField = "title" | "artist" | "pressingYear" | "releaseYear" | "dateAdded";
export type SortOrder = "asc" | "desc";

export interface Filters {
  search: string;
  genres: string[];
  pressingDecade: number | "any";
  releaseDecade: number | "any";
  color: ColorBucket | "any";
  sortBy: SortField;
  sortOrder: SortOrder;
}

export interface DiscogsSessionData {
  accessToken?: string;
  accessTokenSecret?: string;
  username?: string;
  requestTokenSecret?: string;
}
