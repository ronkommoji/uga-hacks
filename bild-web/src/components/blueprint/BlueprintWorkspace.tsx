"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import type { Room, Pin, Point, BlueprintMode, BlueprintSnapshot } from "@/types/blueprint";
import type { Task } from "@/types/database";
import { getRoomAtPoint, getCentroid } from "@/lib/blueprint-geometry";
import { supabase } from "@/lib/supabase";
import { BlueprintCanvas } from "./BlueprintCanvas";
import { RoomModal } from "./RoomModal";
import { TaskModal } from "./TaskModal";
import { PlacePinModal } from "./PlacePinModal";
import { CreateTaskModal } from "./CreateTaskModal";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  MousePointer2,
  Square,
  MapPin,
  Undo2,
  Redo2,
  Trash2,
  Home,
  Upload,
  Loader2,
  ChevronRight,
  ZoomIn,
  ZoomOut,
} from "lucide-react";

const BUCKET = "project-files";
const SIGNED_URL_EXPIRY_SEC = 3600;

function generateId() {
  return crypto.randomUUID();
}

type Props = {
  projectId: string;
  projectName: string;
  tasks: Task[];
  initialBlueprintFilePath?: string | null;
  initialRooms?: Room[];
  initialPins?: Pin[];
};

export function BlueprintWorkspace({
  projectId,
  projectName,
  tasks,
  initialBlueprintFilePath = null,
  initialRooms = [],
  initialPins = [],
}: Props) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const [rooms, setRooms] = useState<Room[]>(initialRooms);
  const [pins, setPins] = useState<Pin[]>(initialPins);
  const [blueprintImageUrl, setBlueprintImageUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [transform, setTransform] = useState({ x: 0, y: 0, k: 1 });
  const [history, setHistory] = useState<BlueprintSnapshot[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [mode, setMode] = useState<BlueprintMode>("view");
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [selectedPinId, setSelectedPinId] = useState<string | null>(null);
  const [drawingRoomPoints, setDrawingRoomPoints] = useState<Point[] | null>(null);
  const [roomModal, setRoomModal] = useState<{
    open: boolean;
    room: Room | null;
    position: { x: number; y: number };
  }>({ open: false, room: null, position: { x: 0, y: 0 } });
  const [taskModal, setTaskModal] = useState<{
    open: boolean;
    pin: Pin | null;
    position: { x: number; y: number };
  }>({ open: false, pin: null, position: { x: 0, y: 0 } });
  const [placePinModal, setPlacePinModal] = useState<{
    open: boolean;
    clientX: number;
    clientY: number;
    world: Point;
  } | null>(null);
  const [createTaskModalOpen, setCreateTaskModalOpen] = useState(false);
  const [createTaskModalPosition, setCreateTaskModalPosition] = useState({ clientX: 0, clientY: 0 });
  const [extraTasks, setExtraTasks] = useState<Task[]>([]);
  const [taskUpdates, setTaskUpdates] = useState<Record<string, Task>>({});
  const [lastCreatedTaskId, setLastCreatedTaskId] = useState<string | null>(null);
  const [imageSize, setImageSize] = useState<{ width: number; height: number } | null>(null);
  const [overviewRoomId, setOverviewRoomId] = useState<string | null>(null);

  const tasksWithExtra = [...tasks, ...extraTasks].map((t) => taskUpdates[t.id] ?? t);

  // Tasks shown in overview: when a room is selected, tasks with pins in that room; otherwise all tasks with pins
  const taskIdsWithPins = Array.from(new Set(pins.map((p) => p.taskId)));
  const overviewTaskIds = overviewRoomId
    ? pins.filter((p) => p.roomId === overviewRoomId).map((p) => p.taskId)
    : taskIdsWithPins;
  const overviewTasks = tasksWithExtra.filter((t) => overviewTaskIds.includes(t.id));

  const pushHistory = useCallback((snapshot: BlueprintSnapshot) => {
    setHistory((prev) => {
      const next = prev.slice(0, historyIndex + 1);
      next.push(snapshot);
      return next.slice(- 50);
    });
    setHistoryIndex((prev) => Math.min(prev + 1, 49));
  }, [historyIndex]);

  // Hydrate from server data when project or initial data changes
  useEffect(() => {
    setRooms(initialRooms);
    setPins(initialPins);
    setHistory([{ rooms: initialRooms, pins: initialPins }]);
    setHistoryIndex(0);
  }, [projectId, initialRooms, initialPins]);

  useEffect(() => {
    if (!initialBlueprintFilePath) return;
    let cancelled = false;
    supabase.storage
      .from(BUCKET)
      .createSignedUrl(initialBlueprintFilePath, SIGNED_URL_EXPIRY_SEC)
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) return;
        if (data?.signedUrl) setBlueprintImageUrl(data.signedUrl);
      });
    return () => {
      cancelled = true;
    };
  }, [initialBlueprintFilePath]);

  // Rooms and pins are persisted to Supabase in each handler; no localStorage sync

  const handleBlueprintUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !projectId) return;
      setUploadError(null);
      setUploading(true);
      // Use a safe storage path: no spaces or special chars (Supabase can reject them)
      const ext = (file.name.split(".").pop() || "png").toLowerCase().replace(/[^a-z0-9]/g, "");
      const safeExt = ext || "png";
      const path = `${projectId}/blueprint-${crypto.randomUUID()}.${safeExt}`;
      const { error: uploadErr } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, { contentType: file.type || "image/png", upsert: false });
      if (uploadErr) {
        setUploadError(uploadErr.message);
        setUploading(false);
        e.target.value = "";
        return;
      }
      const { data: fileRow, error: insertErr } = await supabase
        .from("project_files")
        .insert({
          project_id: projectId,
          name: file.name,
          file_path: path,
          file_size: file.size,
          content_type: file.type || null,
        })
        .select("id")
        .single();
      if (insertErr) {
        setUploadError(insertErr.message);
        setUploading(false);
        e.target.value = "";
        return;
      }
      const { error: updateErr } = await supabase
        .from("projects")
        .update({ blueprint_file_id: fileRow.id })
        .eq("id", projectId);
      if (updateErr) {
        setUploadError(updateErr.message);
        setUploading(false);
        e.target.value = "";
        return;
      }
      const { data: signed } = await supabase.storage
        .from(BUCKET)
        .createSignedUrl(path, SIGNED_URL_EXPIRY_SEC);
      if (signed?.signedUrl) setBlueprintImageUrl(signed.signedUrl);
      router.refresh();
      setUploading(false);
      e.target.value = "";
    },
    [projectId, router]
  );

  useEffect(() => {
    if (!blueprintImageUrl) {
      setImageSize(null);
      return;
    }
    const img = new Image();
    img.onload = () => setImageSize({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => setImageSize(null);
    img.src = blueprintImageUrl;
  }, [blueprintImageUrl]);

  const handleBackgroundClick = useCallback(() => {
    setSelectedRoomId(null);
    setSelectedPinId(null);
    if (mode === "place_pin") {
      // Will be handled by onCanvasClick with world coords
    }
  }, [mode]);

  const handleRoomClick = useCallback((roomId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedRoomId(roomId);
    setSelectedPinId(null);
    const room = rooms.find((r) => r.id === roomId);
    if (room)
      setRoomModal({
        open: true,
        room: { ...room },
        position: { x: e.clientX, y: e.clientY },
      });
  }, [rooms]);

  const handlePinClick = useCallback((pinId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedPinId(pinId);
    setSelectedRoomId(null);
    const pin = pins.find((p) => p.id === pinId);
    if (pin)
      setTaskModal({
        open: true,
        pin,
        position: { x: e.clientX, y: e.clientY },
      });
  }, [pins]);

  const handleCanvasClick = useCallback(
    (world: Point, clientX: number, clientY: number) => {
      if (mode === "place_pin") {
        setPlacePinModal({ open: true, clientX, clientY, world });
        return;
      }
      if (mode === "draw_room") {
        setDrawingRoomPoints((prev) => [...(prev ?? []), world]);
      }
    },
    [mode]
  );

  const handleSaveRoom = useCallback(
    async (payload: { id: string; name: string; points: Point[] }) => {
      setSaveError(null);
      const existing = rooms.find((r) => r.id === payload.id);
      const pointsJson = payload.points as unknown as { x: number; y: number }[];
      if (existing) {
        const { error } = await supabase
          .from("project_blueprint_rooms")
          .update({ name: payload.name, points: pointsJson })
          .eq("id", payload.id)
          .eq("project_id", projectId);
        if (error) {
          setSaveError(error.message);
          return;
        }
        const next = rooms.map((r) =>
          r.id === payload.id ? { ...r, name: payload.name, points: payload.points } : r
        );
        setRooms(next);
        pushHistory({ rooms: next, pins });
      } else {
        const { error } = await supabase.from("project_blueprint_rooms").insert({
          id: payload.id,
          project_id: projectId,
          name: payload.name,
          points: pointsJson,
        });
        if (error) {
          setSaveError(error.message);
          return;
        }
        const newRoom: Room = {
          id: payload.id,
          name: payload.name,
          points: payload.points,
        };
        const next = [...rooms, newRoom];
        setRooms(next);
        pushHistory({ rooms: next, pins });
      }
      setRoomModal((m) => ({ ...m, open: false }));
      setDrawingRoomPoints(null);
      setMode("view");
    },
    [rooms, pins, pushHistory, projectId]
  );

  const handleLinkTask = useCallback(
    async (pinId: string, taskId: string) => {
      setSaveError(null);
      const pin = pins.find((p) => p.id === pinId);
      const { error } = await supabase
        .from("project_blueprint_pins")
        .update({ task_id: taskId })
        .eq("id", pinId)
        .eq("project_id", projectId);
      if (error) {
        setSaveError(error.message);
        return;
      }
      // Auto-assign task location to room name when pin is inside a room
      if (pin?.roomId) {
        const room = rooms.find((r) => r.id === pin.roomId);
        if (room?.name) {
          await supabase.from("tasks").update({ location: room.name }).eq("id", taskId);
        }
      }
      const next = pins.map((p) => (p.id === pinId ? { ...p, taskId } : p));
      setPins(next);
      pushHistory({ rooms, pins: next });
      setTaskModal((m) => ({ ...m, open: false }));
    },
    [pins, rooms, pushHistory, projectId]
  );

  const handleOpenNewTaskModal = useCallback(() => {
    if (placePinModal) {
      setCreateTaskModalPosition({ clientX: placePinModal.clientX, clientY: placePinModal.clientY });
    }
    setCreateTaskModalOpen(true);
  }, [placePinModal]);

  const handlePlacePin = useCallback(
    async (taskId: string) => {
      if (!placePinModal) return;
      setSaveError(null);
      const roomId = getRoomAtPoint(placePinModal.world, rooms);
      const newPin: Pin = {
        id: generateId(),
        x: placePinModal.world.x,
        y: placePinModal.world.y,
        taskId,
        roomId,
      };
      const { error } = await supabase.from("project_blueprint_pins").insert({
        id: newPin.id,
        project_id: projectId,
        task_id: taskId,
        room_id: roomId,
        x: newPin.x,
        y: newPin.y,
      });
      if (error) {
        setSaveError(error.message);
        return;
      }
      // Auto-assign task location to room name when pin is inside a room
      if (roomId) {
        const room = rooms.find((r) => r.id === roomId);
        if (room?.name) {
          await supabase.from("tasks").update({ location: room.name }).eq("id", taskId);
        }
      }
      const next = [...pins, newPin];
      setPins(next);
      pushHistory({ rooms, pins: next });
      setPlacePinModal(null);
    },
    [placePinModal, rooms, pins, pushHistory, projectId]
  );

  const handleTaskCreated = useCallback(
    (newTask: Task) => {
      setExtraTasks((prev) => [...prev, newTask]);
      setCreateTaskModalOpen(false);
      if (placePinModal) {
        handlePlacePin(newTask.id);
      } else {
        setLastCreatedTaskId(newTask.id);
      }
    },
    [placePinModal, handlePlacePin]
  );

  const handleFinishRoom = useCallback(() => {
    const pts = drawingRoomPoints ?? [];
    if (pts.length < 3) return;
    const newRoom: Room = {
      id: generateId(),
      name: "New room",
      points: pts,
    };
    // Position modal near the drawn shape: centroid in screen coords
    let modalX = window.innerWidth / 2;
    let modalY = 120;
    const el = canvasContainerRef.current;
    if (el) {
      const rect = el.getBoundingClientRect();
      const centroid = getCentroid(pts);
      modalX = rect.left + transform.x + centroid.x * transform.k;
      modalY = rect.top + transform.y + centroid.y * transform.k;
    }
    setRoomModal({
      open: true,
      room: newRoom,
      position: { x: modalX, y: modalY },
    });
    setDrawingRoomPoints(null);
  }, [drawingRoomPoints, transform]);

  const handleUndo = useCallback(() => {
    if (historyIndex <= 0) return;
    const idx = historyIndex - 1;
    const snap = history[idx];
    if (snap) {
      setRooms(snap.rooms);
      setPins(snap.pins);
      setHistoryIndex(idx);
    }
  }, [history, historyIndex]);

  const handleRedo = useCallback(() => {
    if (historyIndex >= history.length - 1) return;
    const idx = historyIndex + 1;
    const snap = history[idx];
    if (snap) {
      setRooms(snap.rooms);
      setPins(snap.pins);
      setHistoryIndex(idx);
    }
  }, [history, historyIndex]);

  const handleDelete = useCallback(async () => {
    setSaveError(null);
    if (selectedRoomId) {
      const { error: roomErr } = await supabase
        .from("project_blueprint_rooms")
        .delete()
        .eq("id", selectedRoomId)
        .eq("project_id", projectId);
      if (roomErr) {
        setSaveError(roomErr.message);
        return;
      }
      await supabase
        .from("project_blueprint_pins")
        .delete()
        .eq("room_id", selectedRoomId);
      const nextRooms = rooms.filter((r) => r.id !== selectedRoomId);
      const nextPins = pins.filter((pin) => pin.roomId !== selectedRoomId);
      setRooms(nextRooms);
      setPins(nextPins);
      pushHistory({ rooms: nextRooms, pins: nextPins });
      setSelectedRoomId(null);
      setRoomModal((m) => ({ ...m, open: false }));
    } else if (selectedPinId) {
      const { error } = await supabase
        .from("project_blueprint_pins")
        .delete()
        .eq("id", selectedPinId)
        .eq("project_id", projectId);
      if (error) {
        setSaveError(error.message);
        return;
      }
      const nextPins = pins.filter((p) => p.id !== selectedPinId);
      setPins(nextPins);
      pushHistory({ rooms, pins: nextPins });
      setSelectedPinId(null);
      setTaskModal((m) => ({ ...m, open: false }));
    }
  }, [selectedRoomId, selectedPinId, rooms, pins, pushHistory, projectId]);

  const handleDeletePin = useCallback(
    async (pinId: string) => {
      setSaveError(null);
      const { error } = await supabase
        .from("project_blueprint_pins")
        .delete()
        .eq("id", pinId)
        .eq("project_id", projectId);
      if (error) {
        setSaveError(error.message);
        return;
      }
      const nextPins = pins.filter((p) => p.id !== pinId);
      setPins(nextPins);
      pushHistory({ rooms, pins: nextPins });
      setSelectedPinId(null);
      setTaskModal((m) => ({ ...m, open: false }));
    },
    [pins, pushHistory, projectId]
  );

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Delete" || e.key === "Backspace") {
        handleDelete();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleDelete]);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1 && history.length > 0;

  const zoomFactor = 1.2;
  const minK = 0.2;
  const maxK = 5;

  const handleZoom = useCallback(
    (inOrOut: "in" | "out") => {
      const el = canvasContainerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const factor = inOrOut === "in" ? zoomFactor : 1 / zoomFactor;
      const newK = Math.min(maxK, Math.max(minK, transform.k * factor));
      const dx = (cx - rect.left - transform.x) / transform.k;
      const dy = (cy - rect.top - transform.y) / transform.k;
      const newX = cx - rect.left - dx * newK;
      const newY = cy - rect.top - dy * newK;
      setTransform({ x: newX, y: newY, k: newK });
    },
    [transform]
  );

  const zoomPercent = Math.round(transform.k * 100);

  return (
    <div className="flex flex-col h-full bg-[#FFFDF1]">
      <header className="flex items-center justify-between gap-4 border-b border-[#E8DCC8] bg-white px-4 py-2 shrink-0">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon-sm" asChild>
            <Link href={`/?project=${projectId}`} aria-label="Back to home">
              <Home className="size-4" />
            </Link>
          </Button>
          <h1 className="text-lg font-bold text-[#562F00]">{projectName} — Blueprint</h1>
        </div>
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleBlueprintUpload}
            aria-label="Upload blueprint image"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
          >
            {uploading ? (
              <Loader2 className="size-4 animate-spin mr-1.5" />
            ) : (
              <Upload className="size-4 mr-1.5" />
            )}
            {blueprintImageUrl ? "Replace blueprint" : "Upload blueprint"}
          </Button>
          {(uploadError || saveError) && (
            <span
              className="text-xs text-destructive max-w-[160px] truncate"
              title={uploadError ?? saveError ?? ""}
            >
              {uploadError ?? saveError}
            </span>
          )}
          <Button
            variant="outline"
            size="icon-sm"
            onClick={handleUndo}
            disabled={!canUndo}
            aria-label="Undo"
          >
            <Undo2 className="size-4" />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            onClick={handleRedo}
            disabled={!canRedo}
            aria-label="Redo"
          >
            <Redo2 className="size-4" />
          </Button>
          {(selectedRoomId || selectedPinId) && (
            <Button variant="outline" size="icon-sm" onClick={handleDelete} aria-label="Delete">
              <Trash2 className="size-4" />
            </Button>
          )}
        </div>
      </header>

      <div className="flex flex-1 min-h-0">
        <div className="relative flex-1 min-h-0">
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2">
            <div className="flex rounded-md border border-[#E8DCC8] bg-white/95 shadow-sm p-0.5">
              <Button
                variant={mode === "view" ? "secondary" : "ghost"}
                size="xs"
                onClick={() => setMode("view")}
              >
                <MousePointer2 className="size-3.5 mr-1" />
                View
              </Button>
              <Button
                variant={mode === "draw_room" ? "secondary" : "ghost"}
                size="xs"
                onClick={() => {
                  setMode("draw_room");
                  setDrawingRoomPoints([]);
                }}
              >
                <Square className="size-3.5 mr-1" />
                Draw room
              </Button>
              <Button
                variant={mode === "place_pin" ? "secondary" : "ghost"}
                size="xs"
                onClick={() => setMode("place_pin")}
              >
                <MapPin className="size-3.5 mr-1" />
                Add task
              </Button>
            </div>
            {mode === "draw_room" && (drawingRoomPoints?.length ?? 0) >= 3 && (
              <Button size="sm" onClick={handleFinishRoom}>
                Finish room
              </Button>
            )}
            {mode === "draw_room" && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setDrawingRoomPoints(null);
                  setMode("view");
                }}
              >
                Cancel
              </Button>
            )}
          </div>
          <BlueprintCanvas
            ref={canvasContainerRef}
            transform={transform}
            onTransformChange={setTransform}
            rooms={rooms}
            pins={pins}
            tasks={tasksWithExtra}
            selectedRoomId={selectedRoomId}
            selectedPinId={selectedPinId}
            mode={mode}
            blueprintImageUrl={blueprintImageUrl}
            imageSize={imageSize}
            drawingPoints={mode === "draw_room" ? drawingRoomPoints : null}
            onBackgroundClick={handleBackgroundClick}
            onRoomClick={handleRoomClick}
            onPinClick={handlePinClick}
            onCanvasClick={handleCanvasClick}
          />
          {mode === "draw_room" && drawingRoomPoints && drawingRoomPoints.length > 0 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded bg-black/70 px-3 py-1.5 text-xs text-white">
              Click to add points ({drawingRoomPoints.length}). Finish when 3+ points.
            </div>
          )}
          <div className="absolute bottom-3 right-3 flex items-center gap-0.5 rounded-md border border-[#E8DCC8] bg-white/95 shadow-sm p-0.5">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => handleZoom("out")}
              disabled={transform.k <= minK}
              aria-label="Zoom out"
              className="h-7 w-7"
            >
              <ZoomOut className="size-4" />
            </Button>
            <span className="min-w-10 text-center text-xs text-[#562F00] tabular-nums">
              {zoomPercent}%
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => handleZoom("in")}
              disabled={transform.k >= maxK}
              aria-label="Zoom in"
              className="h-7 w-7"
            >
              <ZoomIn className="size-4" />
            </Button>
          </div>
        </div>

        <aside className="w-64 shrink-0 border-l border-[#E8DCC8] bg-white flex flex-col overflow-hidden">
          <div className="px-3 py-3 border-b border-[#E8DCC8]">
            <h2 className="text-sm font-semibold text-[#562F00]">Overview</h2>
          </div>
          <div className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-6">
            <section>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium uppercase tracking-wide text-[#8B7355]">
                  Rooms ({rooms.length})
                </span>
              </div>
              <ul className="space-y-0.5">
                {rooms.map((room) => {
                  const taskCount = pins.filter((p) => p.roomId === room.id).length;
                  return (
                    <li key={room.id}>
                      <button
                        type="button"
                        onClick={() => setOverviewRoomId((id) => (id === room.id ? null : room.id))}
                        className={`w-full text-left flex items-center justify-between gap-2 rounded px-2 py-1.5 text-sm transition-colors ${
                          overviewRoomId === room.id
                            ? "bg-[#F5E6D3] text-[#562F00]"
                            : "text-[#562F00] hover:bg-[#F5E6D3]/60"
                        }`}
                      >
                        <span className="truncate">{room.name}</span>
                        <span className="flex items-center gap-1 shrink-0">
                          <span className="text-xs text-[#8B7355] tabular-nums">
                            {taskCount}
                          </span>
                          <ChevronRight
                            className={`size-3.5 text-[#8B7355] transition-transform ${
                              overviewRoomId === room.id ? "rotate-90" : ""
                            }`}
                          />
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
            <section>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium uppercase tracking-wide text-[#8B7355]">
                  Tasks ({overviewTasks.length})
                </span>
              </div>
              <ul className="space-y-0.5">
                {overviewTasks.length === 0 ? (
                  <li className="text-xs text-[#8B7355] px-2 py-1.5">
                    {overviewRoomId
                      ? "No tasks in this room."
                      : "No tasks on blueprint yet. Place a pin to link a task."}
                  </li>
                ) : (
                  overviewTasks.map((task) => (
                    <li key={task.id}>
                      <a
                        href={`/project/${projectId}/task/${task.id}`}
                        className="block rounded px-2 py-1.5 text-sm text-[#562F00] hover:bg-[#F5E6D3]/60 truncate"
                      >
                        {task.title ?? "Untitled"}
                      </a>
                    </li>
                  ))
                )}
              </ul>
            </section>
          </div>
        </aside>
      </div>

      <RoomModal
        room={roomModal.room}
        open={roomModal.open}
        position={roomModal.position}
        onClose={() => setRoomModal((m) => ({ ...m, open: false }))}
        onSave={handleSaveRoom}
        onDelete={roomModal.open ? handleDelete : undefined}
      />
      <TaskModal
        projectId={projectId}
        pin={taskModal.pin}
        tasks={tasksWithExtra}
        open={taskModal.open}
        position={taskModal.position}
        onClose={() => setTaskModal((m) => ({ ...m, open: false }))}
        onLinkTask={handleLinkTask}
        onDeletePin={handleDeletePin}
        onTaskUpdated={(task) => setTaskUpdates((prev) => ({ ...prev, [task.id]: task }))}
      />
      {placePinModal && (
        <PlacePinModal
          projectId={projectId}
          tasks={tasksWithExtra}
          position={{ clientX: placePinModal.clientX, clientY: placePinModal.clientY }}
          onClose={() => setPlacePinModal(null)}
          onPlace={handlePlacePin}
          onOpenNewTaskModal={handleOpenNewTaskModal}
          initialSelectedTaskId={lastCreatedTaskId}
          onClearInitialSelection={() => setLastCreatedTaskId(null)}
        />
      )}
      {createTaskModalOpen && (
        <CreateTaskModal
          projectId={projectId}
          position={createTaskModalPosition}
          initialLocation={
            placePinModal
              ? rooms.find((r) => r.id === getRoomAtPoint(placePinModal.world, rooms))?.name ?? ""
              : ""
          }
          onClose={() => setCreateTaskModalOpen(false)}
          onSuccess={handleTaskCreated}
        />
      )}
    </div>
  );
}
