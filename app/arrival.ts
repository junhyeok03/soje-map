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

export function pathLength(path: LatLng[]): number {
  let total = 0;
  for (let i = 1; i < path.length; i += 1) {
    total += distanceMeters(path[i - 1], path[i]);
  }
  return total;
}

/** 경로 시작점에서 meters만큼 걸어간 지점 (경로 길이를 넘으면 끝점) */
export function pointAlongPath(path: LatLng[], meters: number): LatLng {
  if (path.length === 0) throw new Error("빈 경로입니다.");
  let remaining = Math.max(meters, 0);
  for (let i = 1; i < path.length; i += 1) {
    const segment = distanceMeters(path[i - 1], path[i]);
    if (remaining <= segment && segment > 0) {
      return interpolate(path[i - 1], path[i], remaining / segment);
    }
    remaining -= segment;
  }
  return path[path.length - 1];
}

// 수백 m 범위에서는 위경도를 평면 좌표(m)로 근사해도 오차가 무시할 만하다.
function toLocalMeters(origin: LatLng, point: LatLng): [number, number] {
  const metersPerDegreeLat = 110_540;
  const metersPerDegreeLng = 111_320 * Math.cos(toRadians(origin[0]));
  return [
    (point[1] - origin[1]) * metersPerDegreeLng,
    (point[0] - origin[0]) * metersPerDegreeLat,
  ];
}

/** 경로에서 position과 가장 가까운 지점과 그 지점이 속한 구간 번호 */
export function nearestPointOnPath(
  path: LatLng[],
  position: LatLng,
): { point: LatLng; segment: number; distance: number } {
  let best = { point: path[0], segment: 0, distance: distanceMeters(position, path[0]) };

  for (let i = 1; i < path.length; i += 1) {
    const [ax, ay] = toLocalMeters(position, path[i - 1]);
    const [bx, by] = toLocalMeters(position, path[i]);
    const dx = bx - ax;
    const dy = by - ay;
    const lengthSquared = dx * dx + dy * dy;
    const t =
      lengthSquared === 0
        ? 0
        : Math.min(Math.max(-(ax * dx + ay * dy) / lengthSquared, 0), 1);
    const point = interpolate(path[i - 1], path[i], t);
    const distance = distanceMeters(position, point);
    if (distance < best.distance) best = { point, segment: i - 1, distance };
  }

  return best;
}

// 경로에서 이보다 멀리 떨어져 있으면 길을 따라가지 않고 목적지로 곧장 향한다 (예: 멀리서 켠 GPS)
export const ROUTE_SNAP_METERS = 150;

/**
 * 현재 위치에서 목적지까지 갈 경로. 미리 받아 둔 도보 경로 근처에 있으면
 * 가장 가까운 길 위 지점으로 들어가 남은 길을 따라가고, 아니면 직선으로 간다.
 */
export function routeToward(
  position: LatLng,
  destination: LatLng,
  path: LatLng[] | undefined,
): LatLng[] {
  if (!path || path.length < 2) return [position, destination];

  const nearest = nearestPointOnPath(path, position);
  if (nearest.distance > ROUTE_SNAP_METERS) return [position, destination];

  const rest = path.slice(nearest.segment + 1);
  return nearest.distance < 1
    ? [position, ...rest]
    : [position, nearest.point, ...rest];
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
  // 출발지가 있으면 도보 모드로 연다. (link/from/to는 자동차 모드로 열린다)
  return origin
    ? `https://map.kakao.com/link/by/walk/${kakaoPoint(origin.name, origin.coordinates)}/${to}`
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
