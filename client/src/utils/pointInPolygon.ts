/**
 * Point-in-polygon algorithm using ray casting
 * @param point - The point to test {x: number, y: number}
 * @param polygon - Array of polygon vertices [{x: number, y: number}, ...]
 * @returns true if point is inside polygon, false otherwise
 */
export function pointInPolygon(point: { x: number; y: number }, polygon: { x: number; y: number }[]): boolean {
  const { x, y } = point
  let inside = false

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x
    const yi = polygon[i].y
    const xj = polygon[j].x
    const yj = polygon[j].y

    if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
      inside = !inside
    }
  }

  return inside
}

/**
 * Count how many points are inside a polygon
 * @param points - Array of points to test
 * @param polygon - Array of polygon vertices
 * @returns number of points inside the polygon
 */
export function countPointsInPolygon(points: { x: number; y: number }[], polygon: { x: number; y: number }[]): number {
  return points.filter(point => pointInPolygon(point, polygon)).length
}
