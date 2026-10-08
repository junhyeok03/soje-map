import assert from "node:assert/strict";
import test from "node:test";
import {
  ARRIVAL_ENTER_METERS,
  ARRIVAL_EXIT_METERS,
  distanceMeters,
  googleDirectionsUrl,
  interpolate,
  isAccurateEnough,
  kakaoDirectionsUrl,
  resolveArrivalZone,
  withDirectionParticle,
} from "../app/arrival.ts";

const NARAE = { id: "narae", coordinates: [36.3349726, 127.4373939] };
const BRIDGE = { id: "bridge", coordinates: [36.3350612, 127.4382398] };
const ZONES = [NARAE, BRIDGE];

// 위도 1m ≈ 0.000009°
const northOf = ([lat, lng], meters) => [lat + meters * 0.000009, lng];

test("measures short walking distances in meters", () => {
  const distance = distanceMeters(NARAE.coordinates, BRIDGE.coordinates);
  assert.ok(distance > 70 && distance < 85, `got ${distance}`);
  assert.equal(distanceMeters(NARAE.coordinates, NARAE.coordinates), 0);
});

test("enters a zone only inside the enter radius", () => {
  assert.equal(resolveArrivalZone(null, northOf(NARAE.coordinates, 20), ZONES), "narae");
  assert.equal(resolveArrivalZone(null, northOf(NARAE.coordinates, 38), ZONES), null);
});

test("keeps the current zone until the exit radius to absorb GPS jitter", () => {
  const between = northOf(NARAE.coordinates, (ARRIVAL_ENTER_METERS + ARRIVAL_EXIT_METERS) / 2);
  assert.equal(resolveArrivalZone("narae", between, ZONES), "narae");
  assert.equal(resolveArrivalZone("narae", northOf(NARAE.coordinates, 60), ZONES), null);
});

test("switches to a newly entered zone", () => {
  assert.equal(resolveArrivalZone("narae", BRIDGE.coordinates, ZONES), "bridge");
});

test("ignores low-accuracy GPS fixes", () => {
  assert.equal(isAccurateEnough(null), true);
  assert.equal(isAccurateEnough(15), true);
  assert.equal(isAccurateEnough(120), false);
});

test("interpolates simulated walks and clamps progress", () => {
  assert.deepEqual(interpolate([0, 0], [10, 20], 0.5), [5, 10]);
  assert.deepEqual(interpolate([0, 0], [10, 20], 2), [10, 20]);
});

test("builds walking direction links", () => {
  assert.equal(
    kakaoDirectionsUrl("철갑교", [36.1, 127.2]),
    "https://map.kakao.com/link/to/%EC%B2%A0%EA%B0%91%EA%B5%90,36.1,127.2",
  );
  assert.equal(
    googleDirectionsUrl([36.1, 127.2]),
    "https://www.google.com/maps/dir/?api=1&destination=36.1%2C127.2&travelmode=walking",
  );
});

test("attaches the right direction particle to Korean place names", () => {
  assert.equal(withDirectionParticle("철갑교"), "철갑교로");
  assert.equal(withDirectionParticle("전통나래관"), "전통나래관으로");
  assert.equal(withDirectionParticle("대동천 벚꽃길"), "대동천 벚꽃길로");
});
