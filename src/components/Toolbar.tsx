"use client";

import { useRef } from "react";
import type Konva from "konva";
import { useAppStore } from "@/store/useAppStore";

interface ToolbarProps {
  stageRef: React.RefObject<Konva.Stage | null>;
}

export default function Toolbar({ stageRef }: ToolbarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const setBackground = useAppStore((s) => s.setBackground);
  const addRectangle = useAppStore((s) => s.addRectangle);
  const unlockAll = useAppStore((s) => s.unlockAll);
  const backgroundDataUrl = useAppStore((s) => s.backgroundDataUrl);

  const handleUpload = () => fileInputRef.current?.click();

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setBackground(reader.result);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleAddTemplate = () => {
    const stage = stageRef.current;
    const { width, height } = stage
      ? { width: stage.width(), height: stage.height() }
      : { width: 800, height: 600 };
    const w = 140;
    const h = 140;
    addRectangle({
      id: crypto.randomUUID(),
      x: (width - w) / 2,
      y: (height - h) / 2,
      width: w,
      height: h,
      locked: false,
    });
  };

  const handleSaveJpg = () => {
    const stage = stageRef.current;
    if (!stage) return;
    const dataUrl = stage.toDataURL({
      mimeType: "image/jpeg",
      quality: 0.92,
      pixelRatio: 2,
    });
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = "vinyl-display.jpg";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-wrap items-center gap-2 px-3 py-2 border-t dark:border-neutral-700 bg-white dark:bg-neutral-900">
      <button
        type="button"
        onClick={handleAddTemplate}
        className="px-3 py-1.5 text-sm rounded border border-neutral-500 dark:border-neutral-500 text-neutral-900 dark:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800"
      >
        Add Album Template
      </button>
      <button
        type="button"
        onClick={unlockAll}
        className="px-3 py-1.5 text-sm rounded border border-neutral-500 dark:border-neutral-500 text-neutral-900 dark:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800"
      >
        Unlock All Templates
      </button>
      <div className="flex-1" />
      <button
        type="button"
        onClick={handleSaveJpg}
        className="px-3 py-1.5 text-sm rounded border border-neutral-500 dark:border-neutral-500 text-neutral-900 dark:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800"
      >
        Save Display as .jpg
      </button>
      <button
        type="button"
        onClick={handleUpload}
        className="px-3 py-1.5 text-sm rounded border border-neutral-500 dark:border-neutral-500 text-neutral-900 dark:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800"
      >
        {backgroundDataUrl ? "Change Background" : "Upload Background Image"}
      </button>
      <input
        type="file"
        accept="image/*"
        className="hidden"
        ref={fileInputRef}
        onChange={handleFile}
      />
    </div>
  );
}
