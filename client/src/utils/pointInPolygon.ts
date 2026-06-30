function toFiniteXY(p: { x: number; y: number }): { x: number; y: number } | null {
  const x = Number(p.x)
  const y = Number(p.y)
  if (!Number.isFinite(x) || !Number.isFinite(y)) return null
  return { x, y }
}

/**
 * Point-in-polygon algorithm using ray casting
 * @param point - The point to test {x: number, y: number}
 * @param polygon - Array of polygon vertices [{x: number, y: number}, ...]
 * @returns true if point is inside polygon, false otherwise
 */
export function pointInPolygon(point: { x: number; y: number }, polygon: { x: number; y: number }[]): boolean {
  const pt = toFiniteXY(point)
  if (!pt) return false

  const verts = polygon.map(toFiniteXY).filter(Boolean) as { x: number; y: number }[]
  if (verts.length < 3) return false

  const { x, y } = pt
  let inside = false

  for (let i = 0, j = verts.length - 1; i < verts.length; j = i++) {
    const xi = verts[i].x
    const yi = verts[i].y
    const xj = verts[j].x
    const yj = verts[j].y

    if (yi === yj) continue

    if (((yi > y) !== (yj > y)) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) {
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
  return points.filter((point) => pointInPolygon(point, polygon)).length
}
