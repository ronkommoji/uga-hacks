/**
 * Blueprint workspace types: rooms (polygons), pins (task markers), and transform state.
 */

export type Point = { x: number; y: number };

export type Room = {
  id: string;
  name: string;
  points: Point[];
};

export type Pin = {
  id: string;
  x: number;
  y: number;
  taskId: string;
  roomId: string | null;
};

export type Transform = {
  x: number;
  y: number;
  k: number;
};

export type BlueprintSnapshot = {
  rooms: Room[];
  pins: Pin[];
};

export type BlueprintMode = "view" | "draw_room" | "place_pin";
