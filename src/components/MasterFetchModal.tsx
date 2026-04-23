"use client";

import { useEffect, useRef } from "react";
import { useAppStore } from "@/store/useAppStore";

export default function MasterFetchModal() {
  const collection = useAppStore((s) => s.collection);
  const masterFetchStatus = useAppStore((s) => s.masterFetchStatus);
  const masterFetchProgress = useAppStore((s) => s.masterFetchProgress);
  const setMasterFetchStatus = useAppStore((s) => s.setMasterFetchStatus);
  const setMasterFetchProgress = useAppStore((s) => s.setMasterFetchProgress);
  const cacheYear = useAppStore((s) => s.cacheYear);
  const cancelledRef = useRef(false);

  const toFetch = collection.filter(
    (r) => r.masterId && r.originalYear === undefined
  );
  const estimateSeconds = Math.ceil(toFetch.length * 1.5);
  const estimateMinutes = Math.ceil(estimateSeconds / 60);

  useEffect(() => {
    if (masterFetchStatus !== "fetching") return;
    cancelledRef.current = false;

    const releases = collection.filter(
      (r) => r.masterId && r.originalYear === undefined
    );
    if (releases.length === 0) {
      setMasterFetchStatus("done");
      return;
    }

    let done = 0;
    (async () => {
      for (const rel of releases) {
        if (cancelledRef.current) break;
        try {
          const res = await fetch(`/api/discogs/master/${rel.masterId}`);
          const data = (await res.json()) as { year: number | null };
          cacheYear(rel.id, data.year);
        } catch {
          cacheYear(rel.id, null);
        }
        done++;
        setMasterFetchProgress(done / releases.length);
        await new Promise((r) => setTimeout(r, 1500));
      }
      if (!cancelledRef.current) setMasterFetchStatus("done");
    })();

    return () => { cancelledRef.current = true; };
  }, [masterFetchStatus]);

  const handleCancel = () => {
    cancelledRef.current = true;
    setMasterFetchStatus("idle");
    setMasterFetchProgress(0);
  };

  if (masterFetchStatus !== "confirming" && masterFetchStatus !== "fetching") {
    return null;
  }

  const pct = Math.round(masterFetchProgress * 100);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
        {masterFetchStatus === "confirming" ? (
          <>
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
              Fetch Original Release Years?
            </h2>
            <p className="text-sm text-neutral-700 dark:text-neutral-300 mb-4">
              This requires one Discogs API call per album due to rate limiting.
              With <strong>{toFetch.length} albums</strong> in your collection,
              this will take approximately{" "}
              <strong>
                {estimateMinutes === 1
                  ? "~1 minute"
                  : `~${estimateMinutes} minutes`}
              </strong>
              . It only runs once — results are saved locally.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 text-sm rounded border border-neutral-400 dark:border-neutral-600 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => setMasterFetchStatus("fetching")}
                className="px-4 py-2 text-sm rounded bg-sky-600 text-white hover:bg-sky-700"
              >
                Continue
              </button>
            </div>
          </>
        ) : (
          <>
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
              Fetching Release Years…
            </h2>
            <p className="text-sm text-neutral-700 dark:text-neutral-300 mb-4">
              {pct}% complete — you can keep using the app while this runs.
            </p>
            <div className="w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-3 mb-4">
              <div
                className="bg-sky-600 h-3 rounded-full transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 text-sm rounded border border-neutral-400 dark:border-neutral-600 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700"
              >
                Cancel
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
