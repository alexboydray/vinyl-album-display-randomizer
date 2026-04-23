"use client";

import { useMemo } from "react";
import { useAppStore } from "@/store/useAppStore";
import type { ColorBucket, SortField } from "@/types";

const COLORS: (ColorBucket | "any")[] = [
  "any", "red", "orange", "yellow", "green", "blue", "purple", "pink", "grayscale",
];

const DECADES = [1950, 1960, 1970, 1980, 1990, 2000, 2010, 2020];

export default function FilterPanel() {
  const collection = useAppStore((s) => s.collection);
  const filters = useAppStore((s) => s.filters);
  const setFilters = useAppStore((s) => s.setFilters);
  const resetFilters = useAppStore((s) => s.resetFilters);
  const masterFetchStatus = useAppStore((s) => s.masterFetchStatus);
  const setMasterFetchStatus = useAppStore((s) => s.setMasterFetchStatus);

  const genres = useMemo(() => {
    const s = new Set<string>();
    for (const r of collection) {
      for (const g of r.styles) s.add(g);
      for (const g of r.genres) s.add(g);
    }
    return Array.from(s).sort();
  }, [collection]);

  const pressingDecades = useMemo(() => {
    const s = new Set<number>();
    for (const r of collection) {
      if (!r.year || r.year < 1900) continue;
      s.add(Math.floor(r.year / 10) * 10);
    }
    return Array.from(s).sort((a, b) => a - b);
  }, [collection]);

  const handleReleaseDecadeChange = (value: string) => {
    if (value === "any") {
      setFilters({ releaseDecade: "any" });
      return;
    }
    setFilters({ releaseDecade: Number(value) });
    if (masterFetchStatus === "idle") {
      const needsFetch = collection.some(
        (r) => r.masterId && r.originalYear === undefined
      );
      if (needsFetch) setMasterFetchStatus("confirming");
    }
  };

  const selectClass = "border border-neutral-400 dark:border-neutral-600 rounded px-2 py-1 text-sm text-neutral-700 dark:text-neutral-200 bg-white dark:bg-neutral-800";

  return (
    <div className="border dark:border-neutral-700 rounded p-3 space-y-3 bg-white dark:bg-neutral-800">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-sm text-neutral-800 dark:text-neutral-100">Filters</h2>
        <button
          type="button"
          onClick={resetFilters}
          className="text-xs text-sky-700 dark:text-sky-400 hover:underline"
        >
          Clear
        </button>
      </div>
      <input
        type="search"
        placeholder="Search albums or artists…"
        value={filters.search}
        onChange={(e) => setFilters({ search: e.target.value })}
        className="w-full border border-neutral-400 dark:border-neutral-600 rounded px-2 py-1 text-sm text-neutral-700 dark:text-neutral-200 bg-white dark:bg-neutral-800 placeholder:text-neutral-400 dark:placeholder:text-neutral-500"
      />
      <div className="grid grid-cols-2 gap-2">
        <label className="text-xs flex flex-col gap-1">
          <span className="text-neutral-800 dark:text-neutral-200">Colour</span>
          <select
            value={filters.color}
            onChange={(e) => setFilters({ color: e.target.value as ColorBucket | "any" })}
            className={selectClass}
          >
            {COLORS.map((c) => (
              <option key={c} value={c}>{c === "any" ? "Any colour" : c}</option>
            ))}
          </select>
        </label>
        <label className="text-xs flex flex-col gap-1">
          <span className="text-neutral-800 dark:text-neutral-200">Pressing Decade</span>
          <select
            value={filters.pressingDecade}
            onChange={(e) =>
              setFilters({ pressingDecade: e.target.value === "any" ? "any" : Number(e.target.value) })
            }
            className={selectClass}
          >
            <option value="any">Any decade</option>
            {pressingDecades.map((d) => (
              <option key={d} value={d}>{d}s</option>
            ))}
          </select>
        </label>
        <label className="text-xs flex flex-col gap-1">
          <span className="text-neutral-800 dark:text-neutral-200">Release Decade</span>
          <select
            value={filters.releaseDecade}
            onChange={(e) => handleReleaseDecadeChange(e.target.value)}
            className={selectClass}
          >
            <option value="any">Any decade</option>
            {DECADES.map((d) => (
              <option key={d} value={d}>{d}s</option>
            ))}
          </select>
        </label>
        <div className="text-xs flex flex-col gap-1 col-span-2">
          <span className="text-neutral-800 dark:text-neutral-200">Genre</span>
          <select
            value=""
            onChange={(e) => {
              const g = e.target.value;
              if (g && !filters.genres.includes(g))
                setFilters({ genres: [...filters.genres, g] });
            }}
            className={selectClass}
          >
            <option value="">Add a genre…</option>
            {genres.filter((g) => !filters.genres.includes(g)).map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
          {filters.genres.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {filters.genres.map((g) => (
                <span
                  key={g}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-sky-100 dark:bg-sky-900 text-sky-800 dark:text-sky-200 text-[11px]"
                >
                  {g}
                  <button
                    type="button"
                    onClick={() => setFilters({ genres: filters.genres.filter((x) => x !== g) })}
                    className="hover:text-sky-600 dark:hover:text-sky-400 leading-none"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
        </div>
      <div className="flex items-center gap-2 pt-1 border-t border-neutral-200 dark:border-neutral-700">
        <span className="text-xs text-neutral-800 dark:text-neutral-200 shrink-0">Sort by</span>
        <select
          value={filters.sortBy}
          onChange={(e) => setFilters({ sortBy: e.target.value as SortField })}
          className={selectClass + " flex-1"}
        >
          <option value="title">Album Name</option>
          <option value="artist">Artist Name</option>
          <option value="pressingYear">Pressing Year</option>
          <option value="releaseYear">Release Year</option>
          <option value="dateAdded">Recently Added</option>
        </select>
        <button
          type="button"
          onClick={() => setFilters({ sortOrder: filters.sortOrder === "asc" ? "desc" : "asc" })}
          className="px-2 py-1 text-xs rounded border border-neutral-400 dark:border-neutral-600 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-700 shrink-0"
        >
          {filters.sortOrder === "asc" ? "Asc" : "Desc"}
        </button>
      </div>
    </div>
  );
}
