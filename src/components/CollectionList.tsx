"use client";

import { useMemo } from "react";
import { useAppStore } from "@/store/useAppStore";
import { filterReleases } from "@/lib/filter";

export default function CollectionList() {
  const collection = useAppStore((s) => s.collection);
  const filters = useAppStore((s) => s.filters);
  const selectedRectangleId = useAppStore((s) => s.selectedRectangleId);
  const updateRectangle = useAppStore((s) => s.updateRectangle);
  const eligible = useMemo(
    () => filterReleases(collection, filters),
    [collection, filters]
  );

  const handleAlbumClick = (r: typeof eligible[number]) => {
    if (!selectedRectangleId) return;
    updateRectangle(selectedRectangleId, { releaseId: r.id, coverImage: r.coverImage || r.thumb });
  };

  if (collection.length === 0) {
    return (
      <div className="border dark:border-neutral-700 rounded bg-white dark:bg-neutral-800 flex-1 flex items-center justify-center text-xs text-neutral-700 dark:text-neutral-300 p-4 text-center">
        Sign in and load your Discogs collection to populate this list.
      </div>
    );
  }

  return (
    <div className="border dark:border-neutral-700 rounded bg-white dark:bg-neutral-800 flex-1 overflow-auto flex flex-col min-h-0">
      {selectedRectangleId ? (
        <div className="px-3 py-2 text-xs text-white bg-sky-600 sticky top-0">
          Slot selected — click an album to assign it
        </div>
      ) : (
        <div className="px-3 py-2 text-xs text-neutral-800 dark:text-neutral-200 border-b dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 sticky top-0">
          Showing {eligible.length} of {collection.length}
        </div>
      )}
      <ul className="grid grid-cols-3 gap-2 p-2">
        {eligible.slice(0, 300).map((r) => (
          <li
            key={r.id}
            onClick={() => handleAlbumClick(r)}
            className={`aspect-square bg-neutral-100 dark:bg-neutral-700 rounded overflow-hidden relative group ${selectedRectangleId ? "cursor-pointer ring-2 ring-transparent hover:ring-sky-500" : ""}`}
            title={`${r.artist} — ${r.title}${r.year ? ` (${r.year})` : ""}`}
          >
            {r.thumb ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={r.thumb}
                alt={r.title}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[10px] text-neutral-700 dark:text-neutral-300 p-1 text-center">
                {r.title}
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
