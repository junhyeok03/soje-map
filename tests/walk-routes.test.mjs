import assert from "node:assert/strict";
import test from "node:test";
import {
  distanceMeters,
  nearestPointOnPath,
  pathLength,
  pointAlongPath,
  ROUTE_SNAP_METERS,
  routeToward,
} from "../app/arrival.ts";
import { WALK_ROUTES } from "../app/walkRoutes.ts";

// 위도 1m ≈ 0.000009°, 이 위도에서 경도 1m ≈ 0.0000112°
const M_LAT = 0.000009;
const M_LNG = 0.0000112;
const L_PATH = [
  [36.335, 127.437],
  [36.335 + 100 * M_LAT, 127.437],
  [36.335 + 100 * M_LAT, 127.437 + 100 * M_LNG],
];

test("measures and walks along a path at constant distance", () => {
  const total = pathLength(L_PATH);
  assert.ok(Math.abs(total - 200) < 3, `got ${total}`);

  const corner = pointAlongPath(L_PATH, 100);
  assert.ok(distanceMeters(corner, L_PATH[1]) < 2);
  assert.deepEqual(pointAlongPath(L_PATH, 0), L_PATH[0]);
  assert.deepEqual(pointAlongPath(L_PATH, 999), L_PATH[2]);
});

test("finds the nearest point on the path", () => {
  const beside = [36.335 + 50 * M_LAT, 127.437 + 20 * M_LNG];
  const nearest = nearestPointOnPath(L_PATH, beside);
  assert.equal(nearest.segment, 0);
  assert.ok(Math.abs(nearest.distance - 20) < 2, `got ${nearest.distance}`);
});

test("joins the road and follows the rest of it", () => {
  const beside = [36.335 + 50 * M_LAT, 127.437 + 20 * M_LNG];
  const path = routeToward(beside, L_PATH[2], L_PATH);
  assert.deepEqual(path[0], beside);
  assert.equal(path.length, 4); // 현재 위치 → 길 위 지점 → 모퉁이 → 목적지
  assert.deepEqual(path.at(-1), L_PATH[2]);
});

test("goes straight when far from the road or without a route", () => {
  const far = [36.335, 127.437 + (ROUTE_SNAP_METERS + 100) * M_LNG];
  assert.deepEqual(routeToward(far, L_PATH[2], L_PATH), [far, L_PATH[2]]);
  assert.deepEqual(routeToward(far, L_PATH[2], undefined), [far, L_PATH[2]]);
});

test("route snapshot covers the six legs as one connected walk", () => {
  const legs = Object.values(WALK_ROUTES);
  assert.equal(legs.length, 6);
  for (let i = 1; i < legs.length; i += 1) {
    assert.deepEqual(legs[i][0], legs[i - 1].at(-1), `leg ${i} starts where leg ${i - 1} ends`);
  }
  const station = [36.332178, 127.4346057];
  assert.deepEqual(legs[0][0], station);
  // 대전역→전통나래관 도보 경로는 카카오맵 도보 길찾기 결과(529m)와 비슷해야 한다
  const firstLeg = pathLength(legs[0]);
  assert.ok(firstLeg > 480 && firstLeg < 620, `got ${firstLeg}`);
});
