export type LatLng = [number, number];

export type ArrivalZone = {
  id: string;
  coordinates: LatLng;
};

export const ARRIVAL_ENTER_METERS = 30;
export const ARRIVAL_EXIT_METERS = 45;
export const MAX_GPS_ACCURACY_METERS = 50;

const EARTH_RADIUS_METERS = 6_371_000;

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

export function distanceMeters(from: LatLng, to: LatLng): number {
  const dLat = toRadians(to[0] - from[0]);
  const dLng = toRadians(to[1] - from[1]);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(from[0])) *
      Math.cos(toRadians(to[0])) *
      Math.sin(dLng / 2) ** 2;

  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.sqrt(a));
}

/**
 * 현재 머무는 장소를 판정한다. 들어올 때(30m)와 나갈 때(45m) 기준을 다르게
 * 두어 골목에서 GPS가 흔들려도 도착 상태가 깜빡이지 않게 한다.
 */
export function resolveArrivalZone(
  currentId: string | null,
  position: LatLng,
  zones: ArrivalZone[],
): string | null {
  let nearestId: string | null = null;
  let nearestDistance = Infinity;

  for (const zone of zones) {
    const distance = distanceMeters(position, zone.coordinates);
    if (distance <= ARRIVAL_ENTER_METERS && distance < nearestDistance) {
      nearestId = zone.id;
      nearestDistance = distance;
    }
  }

  if (nearestId) return nearestId;

  const current = zones.find((zone) => zone.id === currentId);
  if (
    current &&
    distanceMeters(position, current.coordinates) <= ARRIVAL_EXIT_METERS
  ) {
    return current.id;
  }

  return null;
}

const COMPASS_LABELS = ["북", "북동", "동", "남동", "남", "남서", "서", "북서"];

export function bearingDegrees(from: LatLng, to: LatLng): number {
  const lat1 = toRadians(from[0]);
  const lat2 = toRadians(to[0]);
  const dLng = toRadians(to[1] - from[1]);
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

export function compassLabel(degrees: number): string {
  return `${COMPASS_LABELS[Math.round(degrees / 45) % 8]}쪽`;
}

// 골목을 돌아가는 실제 경로는 직선보다 길어 1.3배로 보정, 보행 속도 분당 67m(시속 4km)
const DETOUR_FACTOR = 1.3;
const WALK_METERS_PER_MINUTE = 67;

export function estimateWalkMinutes(straightMeters: number): number {
  return Math.max(
    1,
    Math.round((straightMeters * DETOUR_FACTOR) / WALK_METERS_PER_MINUTE),
  );
}

export function isAccurateEnough(accuracyMeters: number | null): boolean {
  return accuracyMeters === null || accuracyMeters <= MAX_GPS_ACCURACY_METERS;
}

export function interpolate(from: LatLng, to: LatLng, progress: number): LatLng {
  const t = Math.min(Math.max(progress, 0), 1);
  return [from[0] + (to[0] - from[0]) * t, from[1] + (to[1] - from[1]) * t];
}

export function formatDistance(meters: number): string {
  if (Math.round(meters) < 1000) return `${Math.round(meters)}m`;
  return `${(meters / 1000).toFixed(1)}km`;
}

/** 받침 유무에 맞춰 "로/으로"를 붙인다. (ㄹ 받침은 "로") */
export function withDirectionParticle(word: string): string {
  const code = word.charCodeAt(word.length - 1) - 0xac00;
  if (code < 0 || code > 11171) return `${word}(으)로`;
  const finalConsonant = code % 28;
  return `${word}${finalConsonant === 0 || finalConsonant === 8 ? "로" : "으로"}`;
}

export type DirectionsOrigin = {
  name: string;
  coordinates: LatLng;
};

function kakaoPoint(name: string, [lat, lng]: LatLng): string {
  return `${encodeURIComponent(name)},${lat},${lng}`;
}

export function kakaoDirectionsUrl(
  name: string,
  destination: LatLng,
  origin?: DirectionsOrigin,
): string {
  const to = kakaoPoint(name, destination);
  return origin
    ? `https://map.kakao.com/link/from/${kakaoPoint(origin.name, origin.coordinates)}/to/${to}`
    : `https://map.kakao.com/link/to/${to}`;
}

export function googleDirectionsUrl(
  [lat, lng]: LatLng,
  origin?: DirectionsOrigin,
): string {
  const params = new URLSearchParams({ api: "1" });
  if (origin) params.set("origin", origin.coordinates.join(","));
  params.set("destination", `${lat},${lng}`);
  params.set("travelmode", "walking");
  return `https://www.google.com/maps/dir/?${params}`;
}
