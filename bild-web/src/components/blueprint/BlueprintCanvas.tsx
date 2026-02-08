"use client";

import { useRef, useCallback, useEffect, forwardRef } from "react";
import type { Point, Room, Pin, Transform } from "@/types/blueprint";
import type { Task } from "@/types/database";
import { getCentroid } from "@/lib/blueprint-geometry";

const STATUS_COLOR: Record<string, string> = {
  completed: "#4CAF50",
  blocked: "#E53935",
  in_progress: "#2196F3",
  pending: "#FF9644",
};

type Props = {
  transform: Transform;
  onTransformChange: (t: Transform) => void;
  rooms: Room[];
  pins: Pin[];
  tasks: Task[];
  selectedRoomId: string | null;
  selectedPinId: string | null;
  mode: "view" | "draw_room" | "place_pin";
  blueprintImageUrl: string | null;
  imageSize: { width: number; height: number } | null;
  drawingPoints: Point[] | null;
  onBackgroundClick: () => void;
  onRoomClick: (roomId: string, e: React.MouseEvent) => void;
  onPinClick: (pinId: string, e: React.MouseEvent) => void;
  onCanvasClick: (world: Point, clientX: number, clientY: number) => void;
};

export const BlueprintCanvas = forwardRef<HTMLDivElement, Props>(function BlueprintCanvas(
  {
    transform,
    onTransformChange,
    rooms,
    pins,
    tasks,
    selectedRoomId,
    selectedPinId,
    mode,
    blueprintImageUrl,
    imageSize,
    drawingPoints,
    onBackgroundClick,
    onRoomClick,
    onPinClick,
    onCanvasClick,
  },
  ref
) {
  const containerRef = useRef<HTMLDivElement>(null);

  const setRef = useCallback(
    (el: HTMLDivElement | null) => {
      (containerRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
      if (typeof ref === "function") ref(el);
      else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = el;
    },
    [ref]
  );
  const dragRef = useRef<{ startX: number; startY: number; startT: Transform } | null>(null);

  const taskMap = Object.fromEntries(tasks.map((t) => [t.id, t]));

  const screenToWorld = useCallback(
    (clientX: number, clientY: number): Point => {
      const el = containerRef.current;
      if (!el) return { x: 0, y: 0 };
      const rect = el.getBoundingClientRect();
      const worldX = (clientX - rect.left - transform.x) / transform.k;
      const worldY = (clientY - rect.top - transform.y) / transform.k;
      return { x: worldX, y: worldY };
    },
    [transform]
  );

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const factor = e.deltaY > 0 ? 0.9 : 1.1;
      const newK = Math.min(5, Math.max(0.2, transform.k * factor));
      const dx = (e.clientX - rect.left - transform.x) / transform.k;
      const dy = (e.clientY - rect.top - transform.y) / transform.k;
      const newX = e.clientX - rect.left - dx * newK;
      const newY = e.clientY - rect.top - dy * newK;
      onTransformChange({ ...transform, k: newK, x: newX, y: newY });
    },
    [transform, onTransformChange]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button !== 0) return;
      if ((e.target as SVGElement).closest("[data-room], [data-pin]")) return;
      // Only start pan/drag in view mode; in draw_room/place_pin we want clicks to register
      if (mode !== "view") return;
      dragRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        startT: { ...transform },
      };
    },
    [transform, mode]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!dragRef.current) return;
      const dx = e.clientX - dragRef.current.startX;
      const dy = e.clientY - dragRef.current.startY;
      onTransformChange({
        ...dragRef.current.startT,
        x: dragRef.current.startT.x + dx,
        y: dragRef.current.startT.y + dy,
      });
    },
    [onTransformChange]
  );

  const handleMouseUp = useCallback(() => {
    dragRef.current = null;
  }, []);

  const handleSvgClick = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      const onRoomOrPin = (e.target as SVGElement).closest("[data-room], [data-pin]");
      // In view mode, room/pin handle their own click (they stopPropagation). In place_pin/draw_room we want the click to place/add point even on a room.
      if (onRoomOrPin && mode === "view") return;
      onBackgroundClick();
      if (mode === "place_pin" || mode === "draw_room") {
        const world = screenToWorld(e.clientX, e.clientY);
        onCanvasClick(world, e.clientX, e.clientY);
      }
    },
    [mode, onBackgroundClick, onCanvasClick, screenToWorld]
  );

  useEffect(() => {
    const onGlobalMouseUp = () => { dragRef.current = null; };
    const onGlobalMouseMove = (e: MouseEvent) => {
      if (dragRef.current) {
        const dx = e.clientX - dragRef.current.startX;
        const dy = e.clientY - dragRef.current.startY;
        onTransformChange({
          ...dragRef.current.startT,
          x: dragRef.current.startT.x + dx,
          y: dragRef.current.startT.y + dy,
        });
      }
    };
    window.addEventListener("mouseup", onGlobalMouseUp);
    window.addEventListener("mousemove", onGlobalMouseMove);
    return () => {
      window.removeEventListener("mouseup", onGlobalMouseUp);
      window.removeEventListener("mousemove", onGlobalMouseMove);
    };
  }, [onTransformChange]);

  const w = imageSize?.width ?? 800;
  const h = imageSize?.height ?? 600;

  // Fit image to view when image size is first known
  useEffect(() => {
    if (!imageSize || !containerRef.current) return;
    const el = containerRef.current;
    const rect = el.getBoundingClientRect();
    const padding = 40;
    const maxW = rect.width - padding * 2;
    const maxH = rect.height - padding * 2;
    const scale = Math.min(maxW / imageSize.width, maxH / imageSize.height, 1);
    const x = rect.width / 2 - (imageSize.width * scale) / 2;
    const y = rect.height / 2 - (imageSize.height * scale) / 2;
    onTransformChange({ x, y, k: scale });
  }, [imageSize?.width, imageSize?.height, onTransformChange]);

  const cursorClass =
    mode === "view"
      ? "cursor-grab active:cursor-grabbing"
      : mode === "draw_room" || mode === "place_pin"
        ? "cursor-crosshair"
        : "cursor-grab";

  return (
    <div
      ref={setRef}
      className="absolute inset-0 overflow-hidden bg-[#2a2a2a]"
      onWheel={handleWheel}
      style={{ touchAction: "none" }}
    >
      <svg
        className={`absolute inset-0 w-full h-full ${cursorClass}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={handleSvgClick}
        style={{ touchAction: "none" }}
      >
        <g transform={`translate(${transform.x}, ${transform.y}) scale(${transform.k})`}>
          {/* Blueprint image */}
          {blueprintImageUrl && (
            <image
              href={blueprintImageUrl}
              width={w}
              height={h}
              x={0}
              y={0}
              preserveAspectRatio="xMidYMid meet"
            />
          )}
          {!blueprintImageUrl && (
            <rect width={w} height={h} fill="#1a1a1a" />
          )}
          {!blueprintImageUrl && (
            <text
              x={w / 2}
              y={h / 2}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="#666"
              fontSize={14}
            >
              No blueprint image. Upload a blueprint using the button above.
            </text>
          )}

          {/* Drawing-in-progress polygon */}
          {drawingPoints && drawingPoints.length >= 2 && (
            <path
              d={`M ${drawingPoints[0].x} ${drawingPoints[0].y} ${drawingPoints.slice(1).map((p) => `L ${p.x} ${p.y}`).join(" ")}${drawingPoints.length >= 3 ? " Z" : ""}`}
              fill="rgba(255, 150, 68, 0.15)"
              stroke="#FF9644"
              strokeWidth={2}
              strokeDasharray="6 4"
              strokeLinejoin="round"
              pointerEvents="none"
            />
          )}
          {/* Orange markers at each clicked point while drawing */}
          {drawingPoints?.map((p, i) => (
            <circle
              key={i}
              cx={p.x}
              cy={p.y}
              r={6}
              fill="#FF9644"
              stroke="#fff"
              strokeWidth={2}
              pointerEvents="none"
            />
          ))}

          {/* Room polygons */}
          {rooms.map((room) => {
            const selected = room.id === selectedRoomId;
            const pathD = room.points.length >= 2
              ? `M ${room.points[0].x} ${room.points[0].y} ${room.points.slice(1).map((p) => `L ${p.x} ${p.y}`).join(" ")} Z`
              : "";
            const centroid = room.points.length >= 2 ? getCentroid(room.points) : { x: 0, y: 0 };
            return (
              <g
                key={room.id}
                data-room
                onClick={(e) => {
                  if (mode === "view") {
                    e.stopPropagation();
                    onRoomClick(room.id, e);
                  }
                  // In place_pin or draw_room, let click bubble to canvas so it places pin or adds point
                }}
                style={{
                  cursor: mode === "view" ? "pointer" : "crosshair",
                }}
              >
                <path
                  d={pathD}
                  fill={selected ? "rgba(255, 150, 68, 0.35)" : "rgba(255, 206, 153, 0.2)"}
                  stroke={selected ? "#FF9644" : "rgba(255, 150, 68, 0.6)"}
                  strokeWidth={selected ? 2.5 : 1.5}
                  strokeLinejoin="round"
                />
                {room.points.length >= 2 && (
                  <text
                    x={centroid.x}
                    y={centroid.y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="#562F00"
                    fontSize={12}
                    fontWeight="600"
                    pointerEvents="none"
                  >
                    {room.name}
                  </text>
                )}
              </g>
            );
          })}

          {/* Pins */}
          {pins.map((pin) => {
            const task = taskMap[pin.taskId];
            const status = task?.status ?? "pending";
            const color = STATUS_COLOR[status] ?? STATUS_COLOR.pending;
            const selected = pin.id === selectedPinId;
            return (
              <g
                key={pin.id}
                data-pin
                transform={`translate(${pin.x}, ${pin.y})`}
                onClick={(e) => {
                  e.stopPropagation();
                  onPinClick(pin.id, e);
                }}
                style={{
                  cursor: mode === "view" ? "pointer" : "crosshair",
                }}
              >
                <circle
                  r={selected ? 10 : 8}
                  fill={color}
                  stroke="#fff"
                  strokeWidth={selected ? 3 : 2}
                />
                <text
                  y={-14}
                  textAnchor="middle"
                  dominantBaseline="auto"
                  fill="#000"
                  fontSize={10}
                  fontWeight="600"
                  pointerEvents="none"
                >
                  {task?.title?.slice(0, 12) ?? "?"}
                </text>
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
});
