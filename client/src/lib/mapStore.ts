export type GeoJSONFeature = {
  type: 'Feature'
  geometry: { type: 'Point' | 'Polygon' | 'LineString'; coordinates: any }
  properties: { type: string; label: string; [k: string]: any }
}

export type GeoJSONFeatureCollection = {
  type: 'FeatureCollection'
  features: GeoJSONFeature[]
}

const STORAGE_KEY = 'interactive_map_geojson_v1'

export function saveToLocalStorage(fc: GeoJSONFeatureCollection) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(fc))
    return true
  } catch {
    return false
  }
}

export function loadFromLocalStorage(): GeoJSONFeatureCollection | null {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw)
    if (parsed && parsed.type === 'FeatureCollection' && Array.isArray(parsed.features)) {
      return parsed as GeoJSONFeatureCollection
    }
  } catch {}
  return null
}

export function exportAsBlob(fc: GeoJSONFeatureCollection): Blob {
  const json = JSON.stringify(fc, null, 2)
  return new Blob([json], { type: 'application/json' })
}

export async function importFromFile(file: File): Promise<GeoJSONFeatureCollection> {
  const text = await file.text()
  const parsed = JSON.parse(text)
  if (!parsed || parsed.type !== 'FeatureCollection' || !Array.isArray(parsed.features)) {
    throw new Error('Invalid GeoJSON FeatureCollection')
  }
  return parsed as GeoJSONFeatureCollection
}
