# Blueprint Feature — How It Works

This document describes how the blueprint feature works in the web app so you can query rooms and tasks and build the same view in the React Native mobile app.

---

## Overview

The blueprint is a **project-level floor plan view** where:

1. **Rooms** are polygons drawn on top of a blueprint image (e.g. “Kitchen”, “Room 101”).
2. **Pins** are points on the blueprint, each linked to a **task**. Pins can optionally sit inside a room.
3. The **blueprint image** is a single image per project, stored in Supabase Storage and referenced by the project.

All data lives in **Supabase**. The web app uses the same Supabase client; the mobile app can use the same tables and storage with the Supabase JS client (or REST/GraphQL if you prefer).

---

## Database Schema

### Tables

#### 1. `projects`

Relevant column for blueprint:

| Column               | Type    | Description                                      |
|----------------------|---------|--------------------------------------------------|
| `blueprint_file_id`  | `uuid`  | References `project_files.id` for the blueprint image. Null if no blueprint. |

#### 2. `project_files`

Stores file metadata. The blueprint image is one row here; its `file_path` is the key in the `project-files` storage bucket.

| Column        | Type    |
|---------------|---------|
| `id`          | `uuid`  |
| `project_id`  | `uuid`  |
| `name`        | `text`  |
| `file_path`   | `text`  |
| `file_size`   | `number \| null` |
| `content_type`| `text \| null`   |
| `uploaded_by` | `uuid \| null`   |
| `created_at`  | `timestamptz \| null` |

#### 3. `project_blueprint_rooms`

One row per room polygon.

| Column       | Type     | Description |
|--------------|----------|-------------|
| `id`         | `uuid`   | Primary key (client-generated UUID in web). |
| `project_id` | `uuid`   | Project this room belongs to. |
| `name`       | `text`   | Display name (e.g. "Kitchen"). |
| `points`     | `jsonb`  | Array of `{ x: number, y: number }` in **image pixel coordinates**. |
| `created_at` | `timestamptz \| null` | Optional. |

**Important:** `points` are in the **same coordinate system as the blueprint image** (origin top-left, units = pixels). So a point `{ x: 100, y: 200 }` is 100px from the left and 200px from the top of the image.

#### 4. `project_blueprint_pins`

One row per pin (task marker) on the blueprint.

| Column       | Type     | Description |
|--------------|----------|-------------|
| `id`         | `uuid`   | Primary key. |
| `project_id` | `uuid`   | Project. |
| `task_id`    | `uuid`   | References `tasks.id`. One pin ↔ one task. |
| `room_id`    | `uuid \| null` | Optional. `project_blueprint_rooms.id` if pin is inside a room. |
| `x`          | `number` | X in image coordinates. |
| `y`          | `number` | Y in image coordinates. |
| `created_at` | `timestamptz \| null` | Optional. |

#### 5. `tasks`

Standard task table. Blueprint uses: `id`, `project_id`, `title`, `status`, `location` (can be auto-set from room name when a pin is placed in a room).

---

## How to Query Rooms and Tasks (for Mobile)

### 1. Get project and blueprint image

```ts
// Project (includes blueprint_file_id)
const { data: project } = await supabase
  .from('projects')
  .select('id, name, blueprint_file_id')
  .eq('id', projectId)
  .single();

// Blueprint image path (if any)
let blueprintFilePath: string | null = null;
if (project?.blueprint_file_id) {
  const { data: file } = await supabase
    .from('project_files')
    .select('file_path')
    .eq('id', project.blueprint_file_id)
    .single();
  blueprintFilePath = file?.file_path ?? null;
}

// Signed URL for the image (storage bucket: "project-files")
let imageUrl: string | null = null;
if (blueprintFilePath) {
  const { data } = await supabase.storage
    .from('project-files')
    .createSignedUrl(blueprintFilePath, 3600);
  imageUrl = data?.signedUrl ?? null;
}
```

### 2. Get rooms

```ts
const { data: rooms } = await supabase
  .from('project_blueprint_rooms')
  .select('id, name, points')
  .eq('project_id', projectId)
  .order('created_at', { ascending: true });

// Map to your app type; points are { x: number, y: number }[]
const roomsList = (rooms ?? []).map((r) => ({
  id: r.id,
  name: r.name,
  points: (r.points as { x: number; y: number }[]) ?? [],
}));
```

### 3. Get pins

```ts
const { data: pins } = await supabase
  .from('project_blueprint_pins')
  .select('id, task_id, room_id, x, y')
  .eq('project_id', projectId)
  .order('created_at', { ascending: true });

const pinsList = (pins ?? []).map((p) => ({
  id: p.id,
  taskId: p.task_id,
  roomId: p.room_id,
  x: p.x,
  y: p.y,
}));
```

### 4. Get tasks for the project

```ts
const { data: tasks } = await supabase
  .from('tasks')
  .select('*')
  .eq('project_id', projectId)
  .order('priority', { ascending: true })
  .order('created_at', { ascending: false });
```

### 5. Single query for blueprint page (rooms + pins + tasks)

You can do three parallel requests, or join in app:

- Rooms: `project_blueprint_rooms` by `project_id`
- Pins: `project_blueprint_pins` by `project_id`
- Tasks: `tasks` by `project_id`

Then in app: for each pin, `pin.task_id` → find in `tasks` to show title, status, etc. Optionally use `pin.room_id` to show which room the pin is in (and room name from `project_blueprint_rooms`).

---

## Types (for reference)

Mirror these in React Native if you want type safety:

```ts
type Point = { x: number; y: number };

type Room = {
  id: string;
  name: string;
  points: Point[];
};

type Pin = {
  id: string;
  x: number;
  y: number;
  taskId: string;
  roomId: string | null;
};
```

---

## How the Web UI Uses This

1. **Page:** `src/app/project/[id]/blueprint/page.tsx`  
   Server component that fetches project, tasks, blueprint file path, rooms, and pins (see “How to query” above), then passes them to `BlueprintWorkspace`.

2. **Workspace:** `src/components/blueprint/BlueprintWorkspace.tsx`  
   - State: `rooms`, `pins`, blueprint image URL, transform (pan/zoom), mode (view / draw_room / place_pin).  
   - Modes: **View** (pan, zoom, click room/pin), **Draw room** (click points to form polygon, then name it), **Place pin** (click to place pin, then pick or create task).  
   - All mutations go to Supabase: insert/update/delete on `project_blueprint_rooms` and `project_blueprint_pins`; when placing/linking a pin in a room, `tasks.location` is set to the room name.

3. **Canvas:** `src/components/blueprint/BlueprintCanvas.tsx`  
   - Renders an SVG: image (same coordinate system as `points`), then room polygons, then pins.  
   - Uses `transform` (x, y, k) to pan/zoom.  
   - Room polygon: `points` → SVG `<path>` (M/L/Z). Pin: circle at `(x, y)` with task title above.  
   - Pin color by task status (e.g. completed=green, blocked=red, in_progress=blue, pending=orange).

4. **Geometry:** `src/lib/blueprint-geometry.ts`  
   - `pointInPolygon(point, polygon)` — ray-casting.  
   - `getRoomAtPoint(point, rooms)` — which room contains the point (for assigning `room_id` when placing a pin).  
   - `getCentroid(points)` — for placing room label in the middle of the polygon.

5. **Modals:**  
   - **RoomModal:** edit room name, save (update `project_blueprint_rooms`), delete (delete room and pins in that room).  
   - **TaskModal:** show linked task, pick another task to link to pin, delete pin.  
   - **PlacePinModal:** choose existing task or create new one, then place pin (insert into `project_blueprint_pins`, optionally set `tasks.location` from room name).

---

## Building the Same View in React Native

### Data

- Use the same Supabase project and the same four concepts: **project** (with `blueprint_file_id`), **project_files** (for image path), **project_blueprint_rooms**, **project_blueprint_pins**, and **tasks**.
- Fetch: signed URL for blueprint image, rooms list, pins list, tasks list (all by `project_id` as above).

### UI

- **Image:** Display the blueprint image in a zoomable/pannable view (e.g. `react-native-gesture-handler` + `react-native-reanimated`, or a library like `react-native-zoom-view`). Use the **same coordinate system**: image size = natural width × height; all `rooms[].points` and `pins[].x/y` are in those pixel coordinates.
- **Rooms:** Overlay polygons on top of the image using the same `points` array (convert to your overlay coordinate system; if the image is scaled, scale the points the same way).
- **Pins:** Overlay a marker at each `(pin.x, pin.y)` in the same coordinate system; look up `tasks.find(t => t.id === pin.taskId)` for title and status, and color by status if you like.
- **Touch:** For “view only”, tap room → show room name; tap pin → navigate to task or show task summary. You can skip “draw room” and “place pin” in v1 and only support viewing.

### Optional: Point-in-polygon on mobile

If you need “which room is this point in?” (e.g. for placing a pin or showing room on tap), reuse the same logic as in `src/lib/blueprint-geometry.ts`: `pointInPolygon` and `getRoomAtPoint`. You can copy that small file or reimplement ray-casting in JS/TS.

---

## Summary

| What        | Table / storage              | Key columns / usage |
|------------|-----------------------------|----------------------|
| Blueprint image | `projects.blueprint_file_id` → `project_files` → `project-files` bucket | Signed URL from `file_path`. |
| Rooms      | `project_blueprint_rooms`   | `project_id`, `id`, `name`, `points` (array of `{x,y}` in image coords). |
| Pins       | `project_blueprint_pins`   | `project_id`, `id`, `task_id`, `room_id`, `x`, `y` (image coords). |
| Tasks      | `tasks`                     | Join by `pin.task_id` for title, status, link to task detail. |

Query rooms and tasks as above, and use the same coordinate system and types to replicate the blueprint view in your React Native app.
