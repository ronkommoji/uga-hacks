/**
 * Geometric helpers for the blueprint canvas: point-in-polygon (ray-casting)
 * and centroid for room label placement.
 */

import type { Point } from "@/types/blueprint";

/**
 * Ray-casting: odd number of intersections with polygon edges => point inside.
 */
export function pointInPolygon(point: Point, polygon: Point[]): boolean {
  const { x, y } = point;
  const n = polygon.length;
  let inside = false;
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const xi = polygon[i].x;
    const yi = polygon[i].y;
    const xj = polygon[j].x;
    const yj = polygon[j].y;
    const intersect =
      yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

/**
 * Find which room contains the point. Returns room id or null.
 */
export function getRoomAtPoint(
  point: Point,
  rooms: { id: string; points: Point[] }[]
): string | null {
  for (let i = rooms.length - 1; i >= 0; i--) {
    if (pointInPolygon(point, rooms[i].points)) return rooms[i].id;
  }
  return null;
}

/**
 * Centroid (arithmetic mean of vertices). O(n), good for label placement.
 */
export function getCentroid(points: Point[]): Point {
  if (points.length === 0) return { x: 0, y: 0 };
  let sx = 0;
  let sy = 0;
  for (const p of points) {
    sx += p.x;
    sy += p.y;
  }
  return { x: sx / points.length, y: sy / points.length };
}
