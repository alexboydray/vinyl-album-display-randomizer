"use client";

import { useMemo } from "react";
import { useAppStore } from "@/store/useAppStore";
import { filterReleases } from "@/lib/filter";

export default function RandomizeButton() {
  const collection = useAppStore((s) => s.collection);
  const filters = useAppStore((s) => s.filters);
  const rectangles = useAppStore((s) => s.rectangles);
  const assignRandom = useAppStore((s) => s.assignRandom);
  const undoRandom = useAppStore((s) => s.undoRandom);
  const redoRandom = useAppStore((s) => s.redoRandom);
  const undoStack = useAppStore((s) => s.undoStack);
  const redoStack = useAppStore((s) => s.redoStack);

  const pool = useMemo(
    () => filterReleases(collection, filters),
    [collection, filters]
  );

  const unlockedCount = rectangles.filter((r) => !r.locked).length;
  const disabled =
    rectangles.length === 0 || pool.length === 0 || unlockedCount === 0;

  const btnClass = "w-9 h-9 flex items-center justify-center rounded border border-neutral-500 dark:border-neutral-500 text-neutral-900 dark:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-40 text-base";

  return (
    <div className="flex flex-col gap-1">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => assignRandom(pool)}
          disabled={disabled}
          className="flex-1 px-4 py-2 rounded bg-emerald-600 text-white font-semibold hover:bg-emerald-700 disabled:opacity-50"
        >
          Randomize!
        </button>
        <button
          type="button"
          onClick={undoRandom}
          disabled={undoStack.length === 0}
          className={btnClass}
          title={`Undo (${undoStack.length} step${undoStack.length !== 1 ? "s" : ""} available)`}
        >
          ↺
        </button>
        <button
          type="button"
          onClick={redoRandom}
          disabled={redoStack.length === 0}
          className={btnClass}
          title={`Redo (${redoStack.length} step${redoStack.length !== 1 ? "s" : ""} available)`}
        >
          ↻
        </button>
      </div>
      <div className="text-[11px] text-neutral-700 dark:text-neutral-400 text-center">
        {rectangles.length === 0
          ? "Draw album slots on the canvas first"
          : pool.length === 0
          ? "No releases match the filters"
          : `${unlockedCount} of ${rectangles.length} slots will update`}
      </div>
    </div>
  );
}
