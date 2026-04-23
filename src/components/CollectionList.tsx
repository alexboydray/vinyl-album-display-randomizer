"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useAppStore } from "@/store/useAppStore";
import { filterReleases } from "@/lib/filter";

export default function CollectionList() {
  const collection = useAppStore((s) => s.collection);
  const filters = useAppStore((s) => s.filters);
  const selectedRectangleId = useAppStore((s) => s.selectedRectangleId);
  const updateRectangle = useAppStore((s) => s.updateRectangle);
  const setArtworkOverride = useAppStore((s) => s.setArtworkOverride);
  const artworkOverrides = useAppStore((s) => s.artworkOverrides);

  const eligible = useMemo(
    () => filterReleases(collection, filters),
    [collection, filters]
  );

  const [menu, setMenu] = useState<{ x: number; y: number; releaseId: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pendingReleaseId = useRef<number | null>(null);

  const handleAlbumClick = (r: typeof eligible[number]) => {
    if (!selectedRectangleId) return;
    updateRectangle(selectedRectangleId, { releaseId: r.id, coverImage: r.coverImage || r.thumb });
  };

  const handleContextMenu = (e: React.MouseEvent, releaseId: number) => {
    e.preventDefault();
    e.stopPropagation();
    setMenu({ x: e.clientX, y: e.clientY, releaseId });
  };

  const handleReplaceArtwork = () => {
    if (!menu) return;
    pendingReleaseId.current = menu.releaseId;
    setMenu(null);
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const id = pendingReleaseId.current;
    if (!file || id === null) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setArtworkOverride(id, reader.result);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
    pendingReleaseId.current = null;
  };

  useEffect(() => {
    if (!menu) return;
    const close = () => setMenu(null);
    window.addEventListener("click", close);
    window.addEventListener("contextmenu", close);
    return () => {
      window.removeEventListener("click", close);
      window.removeEventListener("contextmenu", close);
    };
  }, [menu]);

  if (collection.length === 0) {
    return (
      <div className="border dark:border-neutral-700 rounded bg-white dark:bg-neutral-800 flex-1 flex items-center justify-center text-xs text-neutral-700 dark:text-neutral-300 p-4 text-center">
        Sign in and load your Discogs collection to populate this list.
      </div>
    );
  }

  return (
    <>
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
              onContextMenu={(e) => handleContextMenu(e, r.id)}
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

      {menu && (
        <div
          className="fixed z-50 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-600 rounded shadow-lg py-1 text-sm"
          style={{ top: menu.y, left: menu.x }}
        >
              <button
            type="button"
            onClick={handleReplaceArtwork}
            className="w-full text-left px-4 py-2 text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-700"
          >
            Replace artwork from local drive…
          </button>
          {artworkOverrides[menu.releaseId] && (
            <button
              type="button"
              onClick={() => { setArtworkOverride(menu.releaseId, ""); setMenu(null); }}
              className="w-full text-left px-4 py-2 text-red-600 dark:text-red-400 hover:bg-neutral-100 dark:hover:bg-neutral-700"
            >
              Clear custom artwork (restores on next reload)
            </button>
          )}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
    </>
  );
}
