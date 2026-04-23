"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type Konva from "konva";
import {
  Stage,
  Layer,
  Image as KonvaImage,
  Rect,
  Transformer,
  Group,
  Text,
} from "react-konva";
import { useAppStore } from "@/store/useAppStore";
import type { Rectangle } from "@/types";

const MIN_RECT_SIZE = 24;

function proxiedSrc(src: string): string {
  if (!src) return src;
  if (src.startsWith("data:") || src.startsWith("blob:")) return src;
  try {
    const u = new URL(src);
    if (u.host.endsWith("discogs.com")) {
      return `/api/discogs/image?url=${encodeURIComponent(src)}`;
    }
  } catch {}
  return src;
}

function useImageLoader(src: string | null) {
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  useEffect(() => {
    if (!src) {
      setImg(null);
      return;
    }
    const i = new window.Image();
    i.crossOrigin = "anonymous";
    i.src = proxiedSrc(src);
    i.onload = () => setImg(i);
    i.onerror = () => setImg(null);
  }, [src]);
  return img;
}

interface DisplayCanvasProps {
  stageRef: React.RefObject<Konva.Stage | null>;
}

export default function DisplayCanvas({ stageRef }: DisplayCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const trRef = useRef<Konva.Transformer>(null);
  const [size, setSize] = useState({ width: 800, height: 600 });
  const [drawing, setDrawing] = useState<{
    startX: number;
    startY: number;
    id: string;
  } | null>(null);

  const backgroundDataUrl = useAppStore((s) => s.backgroundDataUrl);
  const rectangles = useAppStore((s) => s.rectangles);
  const selectedRectangleId = useAppStore((s) => s.selectedRectangleId);
  const addRectangle = useAppStore((s) => s.addRectangle);
  const updateRectangle = useAppStore((s) => s.updateRectangle);
  const deleteRectangle = useAppStore((s) => s.deleteRectangle);
  const setSelectedRectangle = useAppStore((s) => s.setSelectedRectangle);
  const toggleLock = useAppStore((s) => s.toggleLock);

  const bgImage = useImageLoader(backgroundDataUrl);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => {
      setSize({ width: el.clientWidth, height: el.clientHeight });
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const stage = stageRef.current;
    const transformer = trRef.current;
    if (!stage || !transformer) return;
    if (!selectedRectangleId) {
      transformer.nodes([]);
      return;
    }
    const node = stage.findOne("#rect-" + selectedRectangleId);
    if (node) {
      transformer.nodes([node]);
    } else {
      transformer.nodes([]);
    }
    transformer.getLayer()?.batchDraw();
  }, [selectedRectangleId, rectangles, stageRef]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!selectedRectangleId) return;
      if (e.key === "Delete" || e.key === "Backspace") {
        const target = e.target as HTMLElement | null;
        if (target && /input|textarea/i.test(target.tagName)) return;
        deleteRectangle(selectedRectangleId);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedRectangleId, deleteRectangle]);

  const bgDims = useMemo(() => {
    if (!bgImage) return null;
    const scale = Math.min(
      size.width / bgImage.width,
      size.height / bgImage.height
    );
    const w = bgImage.width * scale;
    const h = bgImage.height * scale;
    return {
      width: w,
      height: h,
      x: (size.width - w) / 2,
      y: (size.height - h) / 2,
    };
  }, [bgImage, size]);

  const handleMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
    const stage = e.target.getStage();
    if (!stage) return;
    if (e.target !== stage && e.target.getAttr("name") !== "background") {
      return;
    }
    const pointer = stage.getPointerPosition();
    if (!pointer) return;
    setSelectedRectangle(null);
    const id = crypto.randomUUID();
    setDrawing({ startX: pointer.x, startY: pointer.y, id });
    addRectangle({
      id,
      x: pointer.x,
      y: pointer.y,
      width: 1,
      height: 1,
      locked: false,
    });
  };

  const handleMouseMove = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (!drawing) return;
    const stage = e.target.getStage();
    if (!stage) return;
    const pointer = stage.getPointerPosition();
    if (!pointer) return;
    const x = Math.min(drawing.startX, pointer.x);
    const y = Math.min(drawing.startY, pointer.y);
    const width = Math.abs(pointer.x - drawing.startX);
    const height = Math.abs(pointer.y - drawing.startY);
    updateRectangle(drawing.id, { x, y, width, height });
  };

  const handleMouseUp = () => {
    if (!drawing) return;
    const rect = rectangles.find((r) => r.id === drawing.id);
    if (rect && (rect.width < MIN_RECT_SIZE || rect.height < MIN_RECT_SIZE)) {
      deleteRectangle(drawing.id);
    } else {
      setSelectedRectangle(drawing.id);
    }
    setDrawing(null);
  };

  return (
    <div
      ref={containerRef}
      className="w-full h-full bg-neutral-200 relative overflow-hidden"
    >
      <Stage
        ref={stageRef}
        width={size.width}
        height={size.height}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        <Layer>
          {bgImage && bgDims && (
            <KonvaImage
              name="background"
              image={bgImage}
              x={bgDims.x}
              y={bgDims.y}
              width={bgDims.width}
              height={bgDims.height}
              listening
            />
          )}
          {rectangles.map((r) => (
            <RectangleNode
              key={r.id}
              rect={r}
              selected={r.id === selectedRectangleId}
              onSelect={() => setSelectedRectangle(r.id)}
              onChange={(patch) => updateRectangle(r.id, patch)}
              onToggleLock={() => toggleLock(r.id)}
            />
          ))}
          <Transformer
            ref={trRef}
            rotateEnabled={false}
            anchorSize={8}
            boundBoxFunc={(oldBox, newBox) => {
              if (newBox.width < MIN_RECT_SIZE || newBox.height < MIN_RECT_SIZE) {
                return oldBox;
              }
              return newBox;
            }}
          />
        </Layer>
      </Stage>
      {!backgroundDataUrl && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-neutral-700 text-sm">
          Upload a background image, then drag on the canvas to draw album slots.
        </div>
      )}
    </div>
  );
}

interface RectangleNodeProps {
  rect: Rectangle;
  selected: boolean;
  onSelect: () => void;
  onChange: (patch: Partial<Rectangle>) => void;
  onToggleLock: () => void;
}

function RectangleNode({
  rect,
  selected,
  onSelect,
  onChange,
  onToggleLock,
}: RectangleNodeProps) {
  const coverImg = useImageLoader(rect.coverImage ?? null);
  const shapeRef = useRef<Konva.Rect>(null);

  return (
    <Group>
      <Rect
        id={"rect-" + rect.id}
        ref={shapeRef}
        x={rect.x}
        y={rect.y}
        width={rect.width}
        height={rect.height}
        draggable={!rect.locked}
        fillPatternImage={coverImg ?? undefined}
        fillPatternScaleX={
          coverImg ? rect.width / coverImg.width : undefined
        }
        fillPatternScaleY={
          coverImg ? rect.height / coverImg.height : undefined
        }
        fill={coverImg ? undefined : "rgba(255,255,255,0.25)"}
        stroke={selected ? "#ef4444" : coverImg ? "transparent" : "#ef4444"}
        strokeWidth={selected ? 2 : 1.5}
        dash={coverImg ? undefined : [8, 4]}
        onMouseDown={(e) => {
          e.cancelBubble = true;
          onSelect();
        }}
        onTap={onSelect}
        onDragEnd={(e) =>
          onChange({ x: e.target.x(), y: e.target.y() })
        }
        onTransformEnd={() => {
          const node = shapeRef.current;
          if (!node) return;
          const scaleX = node.scaleX();
          const scaleY = node.scaleY();
          node.scaleX(1);
          node.scaleY(1);
          onChange({
            x: node.x(),
            y: node.y(),
            width: Math.max(MIN_RECT_SIZE, node.width() * scaleX),
            height: Math.max(MIN_RECT_SIZE, node.height() * scaleY),
          });
        }}
      />
      <Group
        x={rect.x + rect.width - 22}
        y={rect.y + 4}
        onMouseDown={(e) => {
          e.cancelBubble = true;
          onToggleLock();
        }}
        onTap={onToggleLock}
      >
        <Rect
          width={18}
          height={18}
          fill={rect.locked ? "#111827" : "rgba(255,255,255,0.85)"}
          stroke="#111827"
          strokeWidth={1}
          cornerRadius={3}
        />
        <Text
          text={rect.locked ? "L" : "U"}
          fontSize={12}
          fontStyle="bold"
          fill={rect.locked ? "#fff" : "#111827"}
          width={18}
          height={18}
          align="center"
          verticalAlign="middle"
        />
      </Group>
    </Group>
  );
}
