import type { Filters, Release } from "@/types";

export function filterReleases(releases: Release[], filters: Filters): Release[] {
  const query = filters.search.trim().toLowerCase();
  const filtered = releases.filter((r) => {
    if (query) {
      const haystack = `${r.title} ${r.artist}`.toLowerCase();
      if (!haystack.includes(query)) return false;
    }
    if (filters.genres.length > 0) {
      const all = [...r.genres, ...r.styles];
      if (!filters.genres.some((g) => all.includes(g))) return false;
    }
    if (filters.pressingDecade !== "any") {
      const dec = Math.floor((r.year || 0) / 10) * 10;
      if (dec !== filters.pressingDecade) return false;
    }
    if (filters.releaseDecade !== "any") {
      if (r.originalYear == null) return false;
      const dec = Math.floor(r.originalYear / 10) * 10;
      if (dec !== filters.releaseDecade) return false;
    }
    if (filters.color !== "any") {
      if (r.color !== filters.color) return false;
    }
    return true;
  });

  const dir = filters.sortOrder === "asc" ? 1 : -1;
  return [...filtered].sort((a, b) => {
    switch (filters.sortBy) {
      case "title":        return dir * a.title.localeCompare(b.title);
      case "artist":       return dir * a.artist.localeCompare(b.artist);
      case "pressingYear": return dir * ((a.year || 0) - (b.year || 0));
      case "releaseYear":  return dir * ((a.originalYear || a.year || 0) - (b.originalYear || b.year || 0));
      case "dateAdded":    return dir * ((a.dateAdded ?? "").localeCompare(b.dateAdded ?? ""));
    }
  });
}
