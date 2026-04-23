"use client";

import { useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import type Konva from "konva";
import { useAppStore } from "@/store/useAppStore";
import Header from "@/components/Header";
import Toolbar from "@/components/Toolbar";
import FilterPanel from "@/components/FilterPanel";
import CollectionList from "@/components/CollectionList";
import RandomizeButton from "@/components/RandomizeButton";
import MasterFetchModal from "@/components/MasterFetchModal";

const DisplayCanvas = dynamic(() => import("@/components/DisplayCanvas"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center text-neutral-700 dark:text-neutral-300">
      Loading canvas...
    </div>
  ),
});

export default function AppShell() {
  const stageRef = useRef<Konva.Stage | null>(null);
  const darkMode = useAppStore((s) => s.darkMode);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <MasterFetchModal />
      <Header />
      <div className="flex flex-1 min-h-0">
        <section className="flex-1 flex flex-col min-w-0">
          <div className="flex-1 min-h-0">
            <DisplayCanvas stageRef={stageRef} />
          </div>
          <Toolbar stageRef={stageRef} />
        </section>
        <aside className="w-80 border-l bg-neutral-50 dark:bg-neutral-900 dark:border-neutral-700 flex flex-col gap-3 p-3 min-h-0">
          <FilterPanel />
          <CollectionList />
          <RandomizeButton />
        </aside>
      </div>
    </div>
  );
}
