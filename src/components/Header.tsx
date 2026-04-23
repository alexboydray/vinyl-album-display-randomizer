"use client";

import { useCallback, useEffect, useState } from "react";
import { useAppStore } from "@/store/useAppStore";
import { extractColorBucket } from "@/lib/colors";
import type { Release } from "@/types";

export default function Header() {
  const username = useAppStore((s) => s.username);
  const setUsername = useAppStore((s) => s.setUsername);
  const setCollection = useAppStore((s) => s.setCollection);
  const mergeReleaseData = useAppStore((s) => s.mergeReleaseData);
  const setCollectionLoading = useAppStore((s) => s.setCollectionLoading);
  const collection = useAppStore((s) => s.collection);
  const loading = useAppStore((s) => s.collectionLoading);
  const darkMode = useAppStore((s) => s.darkMode);
  const toggleDarkMode = useAppStore((s) => s.toggleDarkMode);
  const clearArtworkOverrides = useAppStore((s) => s.clearArtworkOverrides);
  const artworkOverrides = useAppStore((s) => s.artworkOverrides);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        if (d.authenticated) setUsername(d.username);
        else setUsername(null);
      })
      .catch(() => {})
      .finally(() => !cancelled && setChecking(false));
    return () => {
      cancelled = true;
    };
  }, [setUsername]);

  const handleSignIn = () => {
    window.location.href = "/api/auth/request";
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUsername(null);
    setCollection([]);
  };

  const loadCollection = useCallback(async () => {
    setCollectionLoading(true);
    try {
      const res = await fetch("/api/discogs/collection");
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        alert("Failed to load collection: " + JSON.stringify(body));
        return;
      }
      const data = (await res.json()) as { releases: Release[] };
      setCollection(data.releases);

      let index = 0;
      const concurrency = 4;
      const workers = Array.from({ length: concurrency }, async () => {
        while (index < data.releases.length) {
          const rel = data.releases[index++];
          const src = rel.thumb || rel.coverImage;
          if (!src) continue;
          const proxied = `/api/discogs/image?url=${encodeURIComponent(src)}`;
          const color = await extractColorBucket(proxied);
          mergeReleaseData(rel.id, { color });
        }
      });
      Promise.all(workers);
    } finally {
      setCollectionLoading(false);
    }
  }, [setCollection, setCollectionLoading, mergeReleaseData]);

  return (
    <header className="flex items-center gap-3 px-4 py-2 border-b bg-white dark:bg-neutral-900 dark:border-neutral-700">
      <h1 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Vinyl Album Display Randomizer</h1>
      <div className="flex-1" />
      {username && (
        <>
          {Object.keys(artworkOverrides).length > 0 && (
            <button
              type="button"
              onClick={async () => { clearArtworkOverrides(); await loadCollection(); }}
              disabled={loading}
              className="px-3 py-1.5 text-sm rounded border border-neutral-500 dark:border-neutral-500 text-neutral-900 dark:text-neutral-100 hover:bg-red-600 hover:text-white hover:border-red-600 disabled:opacity-60"
            >
              Remove All Custom Artwork
            </button>
          )}
          <button
            type="button"
            onClick={loadCollection}
            disabled={loading}
            className="px-3 py-1.5 text-sm rounded bg-sky-600 text-white hover:bg-sky-700 disabled:opacity-60"
          >
            {loading
              ? "Loading..."
              : collection.length > 0
              ? "Reload Collection"
              : "Load Collection"}
          </button>
        </>
      )}
      {checking ? (
        <span className="text-sm text-neutral-700 dark:text-neutral-300">...</span>
      ) : username ? (
        <div className="flex items-center gap-2 text-sm">
          <span className="text-neutral-900 dark:text-neutral-100">@{username}</span>
          <button
            type="button"
            onClick={handleLogout}
            className="px-2 py-1 text-xs rounded border border-neutral-500 text-neutral-900 dark:text-neutral-100 dark:border-neutral-500 hover:bg-red-600 hover:text-white hover:border-red-600"
          >
            Sign out
          </button>
          <button
            type="button"
            onClick={toggleDarkMode}
            className="px-2 py-1 text-xs rounded border border-neutral-400 dark:border-neutral-600 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"
            title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
          >
            {darkMode ? "☀︎" : "☾"}
          </button>
        </div>
      ) : (
        <>
          <button
            type="button"
            onClick={handleSignIn}
            className="px-3 py-1.5 text-sm rounded bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200"
          >
            Sign in with Discogs
          </button>
          <button
            type="button"
            onClick={toggleDarkMode}
            className="px-2 py-1.5 text-sm rounded border border-neutral-400 dark:border-neutral-600 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"
            title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
          >
            {darkMode ? "☀︎" : "☾"}
          </button>
        </>
      )}
    </header>
  );
}
