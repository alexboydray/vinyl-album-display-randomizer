import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Filters, MasterFetchStatus, Rectangle, Release } from "@/types";

interface AppState {
  backgroundDataUrl: string | null;
  rectangles: Rectangle[];
  selectedRectangleId: string | null;
  collection: Release[];
  collectionLoading: boolean;
  filters: Filters;
  username: string | null;
  masterFetchStatus: MasterFetchStatus;
  masterFetchProgress: number;
  yearCache: Record<number, number | null>;
  darkMode: boolean;
  undoStack: Rectangle[][];
  redoStack: Rectangle[][];
  artworkOverrides: Record<number, string>;

  setBackground: (dataUrl: string | null) => void;
  addRectangle: (rect: Rectangle) => void;
  updateRectangle: (id: string, patch: Partial<Rectangle>) => void;
  deleteRectangle: (id: string) => void;
  setSelectedRectangle: (id: string | null) => void;
  toggleLock: (id: string) => void;
  unlockAll: () => void;

  setCollection: (releases: Release[]) => void;
  mergeReleaseData: (id: number, patch: Partial<Release>) => void;
  setCollectionLoading: (loading: boolean) => void;
  setFilters: (patch: Partial<Filters>) => void;
  resetFilters: () => void;

  setUsername: (username: string | null) => void;
  assignRandom: (pool: Release[]) => void;

  setMasterFetchStatus: (status: MasterFetchStatus) => void;
  setMasterFetchProgress: (progress: number) => void;
  cacheYear: (id: number, year: number | null) => void;
  toggleDarkMode: () => void;
  undoRandom: () => void;
  redoRandom: () => void;
  setArtworkOverride: (id: number, dataUrl: string) => void;
  clearArtworkOverrides: () => void;
}

const defaultFilters: Filters = {
  search: "",
  genres: [],
  pressingDecade: "any",
  releaseDecade: "any",
  color: "any",
  sortBy: "title" as const,
  sortOrder: "asc",
};

const MAX_HISTORY = 3;

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      backgroundDataUrl: null,
      rectangles: [],
      selectedRectangleId: null,
      collection: [],
      collectionLoading: false,
      filters: defaultFilters,
      username: null,
      masterFetchStatus: "idle",
      masterFetchProgress: 0,
      yearCache: {},
      darkMode: false,
      undoStack: [],
      redoStack: [],
      artworkOverrides: {},

      setBackground: (dataUrl) => set({ backgroundDataUrl: dataUrl }),
      addRectangle: (rect) =>
        set((s) => ({ rectangles: [...s.rectangles, rect] })),
      updateRectangle: (id, patch) =>
        set((s) => ({
          rectangles: s.rectangles.map((r) =>
            r.id === id ? { ...r, ...patch } : r
          ),
        })),
      deleteRectangle: (id) =>
        set((s) => ({
          rectangles: s.rectangles.filter((r) => r.id !== id),
          selectedRectangleId:
            s.selectedRectangleId === id ? null : s.selectedRectangleId,
        })),
      setSelectedRectangle: (id) => set({ selectedRectangleId: id }),
      toggleLock: (id) =>
        set((s) => ({
          rectangles: s.rectangles.map((r) =>
            r.id === id ? { ...r, locked: !r.locked } : r
          ),
        })),
      unlockAll: () =>
        set((s) => ({
          rectangles: s.rectangles.map((r) => ({ ...r, locked: false })),
        })),

      setCollection: (releases) =>
        set((s) => {
          const newCollection = releases.map((r) => ({
            ...r,
            originalYear: s.yearCache[r.id] !== undefined ? s.yearCache[r.id] : undefined,
            ...(s.artworkOverrides[r.id]
              ? { coverImage: s.artworkOverrides[r.id], thumb: s.artworkOverrides[r.id] }
              : {}),
          }));
          const coverMap = new Map(newCollection.map((r) => [r.id, r.coverImage]));
          return {
            collection: newCollection,
            masterFetchStatus: s.masterFetchStatus === "done" ? "done" : "idle",
            rectangles: s.rectangles.map((r) =>
              r.releaseId != null && coverMap.has(r.releaseId)
                ? { ...r, coverImage: coverMap.get(r.releaseId) }
                : r
            ),
          };
        }),

      mergeReleaseData: (id, patch) =>
        set((s) => ({
          collection: s.collection.map((r) =>
            r.id === id ? { ...r, ...patch } : r
          ),
        })),

      setCollectionLoading: (loading) => set({ collectionLoading: loading }),
      setFilters: (patch) =>
        set((s) => ({ filters: { ...s.filters, ...patch } })),
      resetFilters: () => set({ filters: defaultFilters }),

      setUsername: (username) => set({ username }),

      assignRandom: (pool) => {
        if (pool.length === 0) return;
        const { rectangles, undoStack } = get();
        const unlocked = rectangles.filter((r) => !r.locked);
        if (unlocked.length === 0) return;

        const shuffled = [...pool];
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        const next = rectangles.map((r) => {
          if (r.locked) return r;
          const pick =
            shuffled.pop() ?? pool[Math.floor(Math.random() * pool.length)];
          return { ...r, releaseId: pick.id, coverImage: pick.coverImage };
        });
        const newUndo = [...undoStack, rectangles].slice(-MAX_HISTORY);
        set({ rectangles: next, undoStack: newUndo, redoStack: [] });
      },

      undoRandom: () => {
        const { undoStack, rectangles, redoStack } = get();
        if (undoStack.length === 0) return;
        const prev = undoStack[undoStack.length - 1];
        const newUndo = undoStack.slice(0, -1);
        const newRedo = [...redoStack, rectangles].slice(-MAX_HISTORY);
        set({ rectangles: prev, undoStack: newUndo, redoStack: newRedo });
      },

      redoRandom: () => {
        const { redoStack, rectangles, undoStack } = get();
        if (redoStack.length === 0) return;
        const next = redoStack[redoStack.length - 1];
        const newRedo = redoStack.slice(0, -1);
        const newUndo = [...undoStack, rectangles].slice(-MAX_HISTORY);
        set({ rectangles: next, undoStack: newUndo, redoStack: newRedo });
      },

      setMasterFetchStatus: (status) => set({ masterFetchStatus: status }),
      setMasterFetchProgress: (progress) => set({ masterFetchProgress: progress }),
      toggleDarkMode: () => set((s) => ({ darkMode: !s.darkMode })),
      clearArtworkOverrides: () => set({ artworkOverrides: {} }),
      setArtworkOverride: (id, dataUrl) =>
        set((s) => {
          const overrides = { ...s.artworkOverrides };
          if (dataUrl) {
            overrides[id] = dataUrl;
          } else {
            delete overrides[id];
          }
          return {
            artworkOverrides: overrides,
            collection: dataUrl
              ? s.collection.map((r) =>
                  r.id === id ? { ...r, coverImage: dataUrl, thumb: dataUrl } : r
                )
              : s.collection,
            rectangles: dataUrl
              ? s.rectangles.map((r) =>
                  r.releaseId === id ? { ...r, coverImage: dataUrl } : r
                )
              : s.rectangles,
          };
        }),
      cacheYear: (id, year) =>
        set((s) => ({
          yearCache: { ...s.yearCache, [id]: year },
          collection: s.collection.map((r) =>
            r.id === id ? { ...r, originalYear: year } : r
          ),
        })),
    }),
    {
      name: "vadr-app-state",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        backgroundDataUrl: s.backgroundDataUrl,
        rectangles: s.rectangles,
        yearCache: s.yearCache,
        masterFetchStatus: s.masterFetchStatus === "fetching" ? "idle" : s.masterFetchStatus,
        darkMode: s.darkMode,
        artworkOverrides: s.artworkOverrides,
      }),
    }
  )
);
